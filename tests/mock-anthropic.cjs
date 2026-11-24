// A stand-in for the Claude Messages API, for tests/naming-e2e.cjs. Start the site with
//   ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://localhost:4020
// and run this file. It answers POST /v1/messages in the real response format and records each request.
//   POST /__mode {"mode": "ok" | "fail" | "dup-first" | "not-jewellery"}   change behaviour
//   GET  /__requests                                                      what the site sent (images summarised)
//   GET  /__last-image                                                    the last image, as sent (JPEG)
const http = require('http');
const PORT = Number(process.env.MOCK_ANTHROPIC_PORT || 4020);
const POOL = ['Rosée Pendant', 'Ondine Drop Pendant', 'Liora Pendant', 'Calla Pendant', 'Sablé Pendant', 'Vespera Pendant', 'Marée Pendant', 'Nerina Pendant'];

let mode = 'ok';
let requests = [];
let lastImage = null;
let dupServed = false;

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'request-id': 'req_mock' });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.url === '/__mode' && req.method === 'POST') {
        mode = JSON.parse(raw).mode;
        dupServed = false;
        return send(res, 200, { mode });
      }
      if (req.url === '/__requests') return send(res, 200, requests);
      if (req.url === '/__reset') { requests = []; lastImage = null; return send(res, 200, {}); }
      if (req.url === '/__last-image') {
        res.writeHead(lastImage ? 200 : 404, { 'content-type': 'image/jpeg' });
        return res.end(lastImage || '');
      }
      if (!req.url.startsWith('/v1/messages') || req.method !== 'POST') return send(res, 404, { type: 'error', error: { type: 'not_found_error', message: 'not found' } });
      // SDK 1.x sends the key as "Authorization: Bearer"; older SDKs used x-api-key
      const key = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace(/^Bearer /, '');
      if (key !== 'test-key') return send(res, 401, { type: 'error', error: { type: 'authentication_error', message: 'invalid API key' } });

      const body = JSON.parse(raw);
      const content = body.messages?.[0]?.content || [];
      const image = content.find((b) => b.type === 'image');
      const text = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      if (image?.source?.data) lastImage = Buffer.from(image.source.data, 'base64');
      requests.push({
        model: body.model,
        beta: req.headers['anthropic-beta'] || '',
        fallbacks: body.fallbacks,
        format: body.output_config?.format?.type,
        effort: body.output_config?.effort,
        schemaFields: Object.keys(body.output_config?.format?.schema?.properties || {}),
        system: Array.isArray(body.system) ? body.system.map((b) => b.text).join('') : body.system,
        image: image ? { type: image.source.type, media_type: image.source.media_type, bytes: Buffer.from(image.source.data, 'base64').length } : null,
        text,
      });

      if (mode === 'fail') return send(res, 500, { type: 'error', error: { type: 'api_error', message: 'Internal server error' } });

      const kindMatch = /kind "([a-z_]+)"/.exec(text);
      const kind = kindMatch ? kindMatch[1] : 'pendant';
      let out;
      if (mode === 'not-jewellery') {
        out = { is_jewellery: false, kind: 'other', visible_features: 'a plain backdrop', name: 'Nothing Here' };
      } else if (mode === 'dup-first' && !dupServed) {
        dupServed = true;
        out = { is_jewellery: true, kind, visible_features: 'teardrop drop on a fine chain', name: 'Maison Signet Ring' }; // an existing product's name
      } else {
        // like the real model, follow the "do not use" list in the request
        const taken = (/already suggested\. Do not use any of them[^:]*: ([^\n]*)/.exec(text)?.[1] || '').toLowerCase();
        const name = POOL.find((n) => !taken.includes(n.toLowerCase()) && !taken.includes(n.split(' ')[0].toLowerCase())) || 'Unused Pendant';
        out = { is_jewellery: true, kind, visible_features: 'teardrop drop on a fine cable chain', name };
      }
      send(res, 200, {
        id: `msg_mock_${requests.length}`,
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [{ type: 'text', text: JSON.stringify(out) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 60 },
      });
    });
  })
  .listen(PORT, () => console.log(`mock Claude API on :${PORT}`));
