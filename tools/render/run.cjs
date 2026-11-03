// usage: node run.cjs <outdir> <scale> [filter...]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = __dirname;
const types = { '.js': 'text/javascript', '.html': 'text/html', '.mjs': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); });
srv.listen(0, async () => {
  const port = srv.address().port;
  const [outdir, scale = '1', ...filters] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('PAGE', m.type(), m.text().slice(0, 300)); });
  p.on('pageerror', (e) => { console.log('PAGEERR', e.message); process.exit(1); });
  await p.goto(`http://127.0.0.1:${port}/render.html`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const names = await p.evaluate(() => window.jobNames);
  const sel = names.filter((n) => !filters.length || filters.some((f) => n.includes(f)));
  for (const n of sel) {
    const t = Date.now();
    const url = await p.evaluate(([n, s]) => window.renderJob(n, s, s < 1 ? 1 : 1.5), [n, parseFloat(scale)]);
    const out = path.join(outdir, n + '.jpg'); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log(n, ((Date.now() - t) / 1000).toFixed(1) + 's');
  }
  await b.close(); srv.close();
});
