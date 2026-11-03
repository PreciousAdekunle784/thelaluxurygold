// usage: node film-run.cjs <film> <outdir> [scale=1] [every=1] [ss=1.25]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = __dirname;
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); });
srv.listen(0, async () => {
  const [film, outdir, scale = '1', every = '1', ss = '1.25'] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => { console.log('PAGEERR', e.message); process.exit(1); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/film.html`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const frames = await p.evaluate(([n, s, ss]) => window.initFilm(n, s, ss), [film, parseFloat(scale), parseFloat(ss)]);
  const t0 = Date.now();
  for (let i = 0; i < frames; i += Number(every)) {
    const url = await p.evaluate((i) => window.renderFrame(i), i);
    fs.writeFileSync(path.join(outdir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    if (i % 24 === 0) console.log(`${film} frame ${i}/${frames} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log('DONE', frames, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await b.close(); srv.close();
});
