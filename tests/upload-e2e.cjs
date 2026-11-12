// Admin image uploads in every common format. Run against `npm start` with ADMIN_PASSWORD set:
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/upload-e2e.cjs
// Each file is uploaded twice: once normally (the browser resizes what it can open) and once with the
// browser's image decoding disabled, so the server has to read every format itself. Large files are sent
// in pieces, as on Vercel, where one request is capped at ~4.5 MB.
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3100';
const PASS = process.env.ADMIN_PASSWORD || 'test-admin-pass-123';
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

async function makeFiles(dir) {
  const src = path.join(__dirname, '..', 'public', 'images', 'laluxurygold', 'products', 'maison-signet-1.webp');
  const base = sharp(src);
  // a noisy 6000×7500 photo, so the JPEG is far larger than one request allows
  const noise = await sharp({ create: { width: 6000, height: 7500, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png().toBuffer();
  const files = {
    'photo.jpg': await base.clone().jpeg({ quality: 90 }).toBuffer(),
    'transparent.png': await base.clone().ensureAlpha(0.5).png().toBuffer(),
    'photo.webp': await base.clone().webp().toBuffer(),
    'photo.avif': await base.clone().avif().toBuffer(),
    'animation.gif': await base.clone().gif().toBuffer(),
    'scan.tiff': await base.clone().resize(4000, 5000).tiff({ compression: 'none' }).toBuffer(), // ~60 MB
    'huge-camera.jpg': await sharp(noise).jpeg({ quality: 95 }).toBuffer(),
    'logo.svg': Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#0e3326"/><circle cx="200" cy="250" r="120" fill="#c8a46a"/></svg>'),
    'iphone-photo.heic': fs.readFileSync(path.join(__dirname, 'fixtures', 'iphone-photo.heic')),
    'scan.bmp': fs.readFileSync(path.join(__dirname, 'fixtures', 'scan.bmp')),
    'IMG_2041.HEIC': fs.readFileSync(path.join(__dirname, 'fixtures', 'iphone-photo.heic')), // upper-case extension, as iPhones name them
  };
  for (const [name, buf] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), buf);
  fs.writeFileSync(path.join(dir, 'not-a-picture.jpg'), 'hello, this is text');
  return Object.keys(files);
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llg-upload-'));
  const names = await makeFiles(dir);
  for (const n of ['scan.tiff', 'huge-camera.jpg']) console.log(`      ${n}: ${(fs.statSync(path.join(dir, n)).size / 1048576).toFixed(1)} MB`);
  const b = await chromium.launch();

  for (const mode of ['browser converts', 'server converts']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    // measure every upload request from inside the page (the browser doesn't report bodies that contain files)
    await ctx.addInitScript(() => {
      window.__uploads = { count: 0, biggest: 0 };
      const orig = window.fetch;
      window.fetch = function (input, init) {
        const body = init && init.body;
        if (body instanceof FormData) {
          let size = 0;
          for (const [, v] of body.entries()) size += typeof v === 'string' ? v.length : v.size;
          if (size > 1000) {
            window.__uploads.count++;
            window.__uploads.biggest = Math.max(window.__uploads.biggest, size);
          }
        }
        return orig.apply(this, arguments);
      };
    });
    if (mode === 'server converts')
      await ctx.addInitScript(() => {
        window.createImageBitmap = () => Promise.reject(new Error('disabled for test'));
        HTMLImageElement.prototype.decode = function () { return Promise.reject(new Error('disabled for test')); };
      });
    const a = await ctx.newPage();
    await a.goto(BASE + '/admin/products/new');
    if (a.url().includes('/admin/login')) {
      await a.fill('input[name=password]', PASS);
      await a.click('button:has-text("Sign in")');
      await a.waitForURL(/\/admin\/products\/new/);
    }
    await a.waitForLoadState('load');
    const input = a.locator('input[type=file]');
    ok(`[${mode}] file picker accepts any image type`, (await input.getAttribute('accept')).startsWith('image/*') && (await input.getAttribute('accept')).includes('.heic'));
    const thumbs = a.locator('img[src*="/media/"], img[src*="%2Fmedia%2F"]');

    for (const name of names) {
      const before = await thumbs.count();
      const postsBefore = (await a.evaluate(() => window.__uploads)).count;
      const t0 = Date.now();
      await input.setInputFiles(path.join(dir, name));
      await a.waitForFunction((n) => document.querySelectorAll('img[src*="/media/"], img[src*="%2Fmedia%2F"]').length > n || /couldn|didn|failed/i.test(document.querySelector('[role=status]')?.textContent || ''), before, { timeout: 120000 }).catch(() => {});
      const added = (await thumbs.count()) > before;
      const status = (await a.locator('[role=status]').first().textContent()) || '';
      const posts = (await a.evaluate(() => window.__uploads)).count;
      ok(`[${mode}] ${name} uploads`, added, added ? `${((Date.now() - t0) / 1000).toFixed(1)} s, ${posts - postsBefore} request(s)` : status);
      if (mode === 'server converts' && /tiff|huge/.test(name)) ok(`[${mode}] ${name} is sent in pieces`, posts - postsBefore > 1, String(posts - postsBefore));
      if (added) {
        const src = await thumbs.last().getAttribute('src');
        const id = decodeURIComponent(src).match(/\/media\/([A-Za-z0-9_-]+)/)?.[1];
        const res = await a.request.get(BASE + '/media/' + id);
        const meta = await sharp(await res.body()).metadata();
        ok(`[${mode}] ${name} is stored as an optimised WebP`, res.headers()['content-type'] === 'image/webp' && meta.width <= 1600 && meta.height <= 2000 && meta.width >= 200, `${meta.format} ${meta.width}×${meta.height}`);
      }
    }
    const before = await thumbs.count();
    await input.setInputFiles(path.join(dir, 'not-a-picture.jpg'));
    await a.waitForFunction(() => /couldn/i.test(document.querySelector('[role=status]')?.textContent || ''), null, { timeout: 30000 }).catch(() => {});
    const err = (await a.locator('[role=status]').first().textContent()) || '';
    ok(`[${mode}] a file that isn't a picture gets a clear message`, (await thumbs.count()) === before && err.includes('not-a-picture.jpg') && /couldn.t be read as a picture/.test(err), err.slice(0, 100));
    const biggestRequest = (await a.evaluate(() => window.__uploads)).biggest;
    ok(`[${mode}] no request is over 4.5 MB (Vercel limit)`, biggestRequest > 0 && biggestRequest < 4.5 * 1024 * 1024, `largest ${(biggestRequest / 1048576).toFixed(2)} MB`);
    await ctx.close();
  }

  // the hero uploader uses the same pipeline
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const h = await ctx.newPage();
  await h.goto(BASE + '/admin/settings');
  if (h.url().includes('/admin/login')) {
    await h.fill('input[name=password]', PASS);
    await h.click('button:has-text("Sign in")');
    await h.waitForURL(/\/admin\/settings/);
  }
  const heroInput = h.locator('input[type=file]').first();
  ok('hero uploader accepts any image type', (await heroInput.getAttribute('accept')).includes('.heic'));
  await ctx.close();

  await b.close();
  fs.rmSync(dir, { recursive: true, force: true });
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} upload checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
