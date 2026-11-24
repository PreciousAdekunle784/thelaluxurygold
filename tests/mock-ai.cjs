// A stand-in for the AI APIs used for product-name suggestions, for tests/naming-e2e.cjs. It answers, in their
// real response formats, Google Gemini (POST /v1/models/<model>:generateContent) and Anthropic Claude
// (POST /v1/messages), and records each request. Start the site with either
//   GEMINI_API_KEY=test-key GEMINI_BASE_URL=http://localhost:4020
//   ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://localhost:4020
// and run this file.
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

/** What the "model" answers: follows the request's do-not-use list and kept kind, like the real models. */
function answer(text) {
  const kind = /kind "([a-z_]+)"/.exec(text)?.[1] || 'pendant';
  if (mode === 'not-jewellery') return { is_jewellery: false, kind: 'other', visible_features: 'a plain backdrop', name: 'Nothing Here' };
  if (mode === 'dup-first' && !dupServed) {
    dupServed = true;
    return { is_jewellery: true, kind, visible_features: 'teardrop drop on a fine chain', name: 'Maison Signet Ring' }; // an existing product's name
  }
  const taken = (/already suggested\. Do not use any of them[^:]*: ([^\n]*)/.exec(text)?.[1] || '').toLowerCase();
  const name = POOL.find((n) => !taken.includes(n.toLowerCase()) && !taken.includes(n.split(' ')[0].toLowerCase())) || 'Unused Pendant';
  return { is_jewellery: true, kind, visible_features: 'teardrop drop on a fine cable chain', name };
}

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
      // ---------------------------------------------------------------- Gemini
      const gem = /^\/v1(?:beta)?\/models\/([^:/]+):generateContent/.exec(req.url);
      if (gem && req.method === 'POST') {
        if (req.headers['x-goog-api-key'] !== 'test-key') return send(res, 400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } });
        const body = JSON.parse(raw);
        const parts = body.contents?.[0]?.parts || [];
        const img = parts.find((p) => p.inlineData);
        const text = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('\n');
        if (img) lastImage = Buffer.from(img.inlineData.data, 'base64');
        const gc = body.generationConfig || {};
        requests.push({
          provider: 'gemini',
          model: gem[1],
          apiKeyHeader: true,
          format: gc.responseMimeType === 'application/json' && gc.responseJsonSchema ? 'json_schema' : gc.responseMimeType,
          schemaFields: Object.keys(gc.responseJsonSchema?.properties || {}),
          system: (body.systemInstruction?.parts || []).map((p) => p.text).join(''),
          image: img ? { type: 'inline', media_type: img.inlineData.mimeType, bytes: Buffer.from(img.inlineData.data, 'base64').length } : null,
          text,
        });
        if (mode === 'fail') return send(res, 500, { error: { code: 500, message: 'Internal error encountered.', status: 'INTERNAL' } });
        // a model this key can't use: the site should move on to the next model
        if (mode === 'model-503' && gem[1] === 'gemini-3.8-flash') return send(res, 503, { error: { code: 503, message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.', status: 'UNAVAILABLE' } });
        if (mode === 'model-404' && gem[1] === 'gemini-3.8-flash') return send(res, 404, { error: { code: 404, message: `models/${gem[1]} is not found for API version v1, or is not supported for generateContent.`, status: 'NOT_FOUND' } });
        return send(res, 200, {
          candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(answer(text)) }] }, finishReason: 'STOP', index: 0 }],
          usageMetadata: { promptTokenCount: 1300, candidatesTokenCount: 40, totalTokenCount: 1340 },
          modelVersion: gem[1],
        });
      }

      // ---------------------------------------------------------------- Claude
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
        provider: 'claude',
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

      const out = answer(text);
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
  .listen(PORT, () => console.log(`mock AI APIs (Gemini + Claude) on :${PORT}`));
