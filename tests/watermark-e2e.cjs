// Automatic watermarking of product images. Run against `npm start` with ADMIN_PASSWORD set:
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... [DATABASE_URL=...] node tests/watermark-e2e.cjs
// Uses the same database as the server (DATABASE_URL, else .data/llg.sqlite) to check stored originals.
// Creates a test product and test images; the product is deleted at the end.
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3100';
const PASS = process.env.ADMIN_PASSWORD || 'test-admin-pass-123';
const ROOT = path.join(__dirname, '..');
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

// ---------------------------------------------------------------- database access (same DB as the server)
let pg = null;
let lite = null;
async function q(sql, params = []) {
  if (process.env.DATABASE_URL) {
    if (!pg) pg = (await import('postgres')).default(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
    return pg.unsafe(sql, params);
  }
  if (!lite) {
    const { DatabaseSync } = require('node:sqlite');
    lite = new DatabaseSync(path.join(ROOT, '.data', 'llg.sqlite'));
    lite.exec('PRAGMA busy_timeout = 8000');
  }
  return lite.prepare(sql.replace(/\$(\d+)/g, '?$1')).all(...params.map((p) => (Buffer.isBuffer(p) ? new Uint8Array(p) : p)));
}
const buf = (v) => Buffer.from(v);

// ---------------------------------------------------------------- pixel helpers
const raw = async (input) => {
  const { data, info } = await sharp(input).rotate().toColorspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};
/** Mean absolute difference between two same-size images inside a box (0–255). */
function diff(a, b, box) {
  let sum = 0, n = 0;
  for (let y = box.top; y < box.top + box.height; y++)
    for (let x = box.left; x < box.left + box.width; x++) {
      const i = (y * a.width + x) * 3;
      sum += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
      n += 3;
    }
  return sum / n;
}
/** The plain (unwatermarked) display version of an original: same resize the server does. */
const plainDisplay = async (original) => raw(await sharp(original).rotate().resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true }).toBuffer());

(async () => {
  const { placement, visibleRegion, WATERMARK_STYLE } = await import('../src/lib/watermark/core.ts');
  const { WATERMARK_REVISION: REV } = await import('../src/lib/watermark/revision.ts');
  const logoMeta = await sharp(path.join(ROOT, 'src/lib/watermark/wordmark-ink.png')).metadata();
  const aspect = logoMeta.height / logoMeta.width;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llg-wm-'));
  const src = path.join(ROOT, 'assets/originals/products/maison-signet-1.webp'); // light studio shot
  const dark = path.join(ROOT, 'assets/originals/products/classic-hoops-2.webp'); // obsidian styled shot
  const noise = await sharp({ create: { width: 4000, height: 5000, channels: 3, noise: { type: 'gaussian', mean: 200, sigma: 25 } } }).png().toBuffer();
  const files = {
    'portrait.jpg': await sharp(src).jpeg({ quality: 92 }).toBuffer(), // 1200×1500
    'small.jpeg': await sharp(src).resize(600, 750).jpeg().toBuffer(),
    'square.png': await sharp(src).resize(900, 900, { fit: 'cover' }).png().toBuffer(),
    'landscape.webp': await sharp(dark).resize(2400, 1200, { fit: 'cover' }).webp({ quality: 92 }).toBuffer(),
    'phone-tall.jpg': await sharp(src).resize(1125, 2000, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer(), // 9:16 phone photo
    'wide.jpg': await sharp(src).resize(1600, 900, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer(), // 16:9
    'transparent.png': await sharp(src).resize(800, 1000).ensureAlpha(0.6).png().toBuffer(),
    'camera-4000x5000.jpg': await sharp(noise).jpeg({ quality: 95 }).toBuffer(), // > 3 MB → uploaded in pieces
    'dark.jpg': await sharp(dark).jpeg({ quality: 92 }).toBuffer(),
  };
  for (const [n, b] of Object.entries(files)) fs.writeFileSync(path.join(dir, n), b);
  console.log(`      camera-4000x5000.jpg is ${(files['camera-4000x5000.jpg'].length / 1048576).toFixed(1)} MB`);

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const a = await ctx.newPage();
  a.on('dialog', (d) => d.accept());
  const errors = [];
  a.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  let productId = null;

  try {
    await a.goto(BASE + '/admin/products/new');
    await a.fill('input[name=password]', PASS);
    await a.click('button:has-text("Sign in")');
    await a.waitForURL(/\/admin\/products\/new/);
    await a.waitForLoadState('load');

    // ---------------------------------------------------------------- admin experience is unchanged
    const formText = (await a.locator('main').textContent()).toLowerCase();
    ok('admin product form has no watermark settings or buttons', !formText.includes('watermark') && (await a.locator('main input[type=range]').count()) === 0);

    // ---------------------------------------------------------------- new uploads
    const thumbs = a.locator('main img[src*="%2Fmedia%2F"], main img[src*="/media/"]');
    const uploaded = {};
    for (const name of Object.keys(files)) {
      const before = await thumbs.count();
      await a.locator('input[type=file]').setInputFiles(path.join(dir, name));
      await a.waitForFunction((n) => document.querySelectorAll('main img[src*="%2Fmedia%2F"], main img[src*="/media/"]').length > n || /couldn|didn|failed/i.test(document.querySelector('[role=status]')?.textContent || ''), before, { timeout: 120000 }).catch(() => {});
      const src = decodeURIComponent((await thumbs.last().getAttribute('src')) || '');
      const id = src.match(/\/media\/(m[a-f0-9]{16})\/([a-z0-9]+)/);
      ok(`${name}: uploads with just "select file"`, id && (await thumbs.count()) > before, id ? `${id[1]} (${id[2]})` : await a.locator('[role=status]').first().textContent());
      if (id) uploaded[name] = id[1];
    }

    for (const [name, id] of Object.entries(uploaded)) {
      const res = await a.request.get(`${BASE}/media/${id}/${REV}`);
      const served = await res.body();
      const meta = await sharp(served).metadata();
      const original = files[name];
      const oMeta = await sharp(original).metadata();
      // 1. the original is stored byte for byte, separately from the served image
      const [row] = await q('SELECT content_type, filename, bytes FROM media_originals WHERE media_id = $1', [id]);
      ok(`${name}: original kept untouched`, row && buf(row.bytes).equals(original), row ? `${row.content_type}, ${buf(row.bytes).length} bytes` : 'no original row');
      // 2. served image: same proportions as the original, never enlarged
      const scale = Math.min(1, 1600 / oMeta.width, 2000 / oMeta.height);
      ok(`${name}: served at the original's proportions`, meta.width === Math.round(oMeta.width * scale) && meta.height === Math.round(oMeta.height * scale), `${oMeta.width}×${oMeta.height} → ${meta.width}×${meta.height} ${meta.format}`);
      // 3. the watermark is in the pixels, in the middle, at the specified size; the rest of the image is unchanged
      const s = await raw(served);
      const p = await plainDisplay(original);
      const box = placement(s.width, s.height, aspect);
      const inLogo = diff(s, p, box);
      const elsewhere = diff(s, p, { left: 0, top: 0, width: s.width, height: Math.round(s.height * 0.3) }); // top of the photo: no watermark there
      // sizes are measured within the part of the photo the website's portrait frames show
      const region = visibleRegion(s.width, s.height);
      const widthShare = box.width / region.width;
      const offCentre = Math.max(Math.abs(box.left + box.width / 2 - s.width / 2), Math.abs(box.top + box.height / 2 - s.height / 2));
      ok(`${name}: brand name drawn into the pixels in the middle`, inLogo > elsewhere + 1.2 && offCentre <= 1, `change in logo area ${inLogo.toFixed(2)} vs elsewhere ${elsewhere.toFixed(2)}`);
      ok(`${name}: brand name ${(widthShare * 100).toFixed(1)}% of the shown width, centred`, (widthShare >= 0.82 && widthShare <= 0.9) || box.width === WATERMARK_STYLE.minWidthPx || box.height <= region.height * WATERMARK_STYLE.maxHeightRatio + 1, `${box.width}×${box.height} (logo proportions ${(box.height / box.width).toFixed(3)} vs ${aspect.toFixed(3)})`);
      ok(`${name}: logo proportions preserved`, Math.abs(box.height / box.width - aspect) < 0.02);
      // 4. the brand name is inside what the site's 4:5 and 5:6 frames show (object-fit: cover, centred), never trimmed off
      const shown = (ar) => { const w = Math.min(s.width, s.height * ar), h = Math.min(s.height, s.width / ar); return { l: (s.width - w) / 2, t: (s.height - h) / 2, r: (s.width + w) / 2, b: (s.height + h) / 2 }; };
      const inside = [4 / 5, 5 / 6].every((ar) => { const f = shown(ar); return box.left >= f.l && box.top >= f.t && box.left + box.width <= f.r && box.top + box.height <= f.b; });
      ok(`${name}: brand name stays visible in the website's portrait frames`, inside, `${s.width}×${s.height}, logo at ${box.left},${box.top}`);
    }

    // transparency preserved
    if (uploaded['transparent.png']) {
      const meta = await sharp(await (await a.request.get(`${BASE}/media/${uploaded['transparent.png']}/${REV}`)).body()).metadata();
      ok('transparent PNG keeps its transparency', meta.hasAlpha === true, `channels ${meta.channels}`);
    }
    // tone adapts: dark letters on light photos, light letters on dark ones
    {
      const light = await raw(await (await a.request.get(`${BASE}/media/${uploaded['portrait.jpg']}/${REV}`)).body());
      const darkImg = await raw(await (await a.request.get(`${BASE}/media/${uploaded['dark.jpg']}/${REV}`)).body());
      const pl = await plainDisplay(files['portrait.jpg']);
      const pd = await plainDisplay(files['dark.jpg']);
      ok('the brand name shows on light photos and on dark ones (light letters, soft dark shadow)', diff(light, pl, placement(light.width, light.height, aspect)) > 1.5 && diff(darkImg, pd, placement(darkImg.width, darkImg.height, aspect)) > 1.5, `light ${diff(light, pl, placement(light.width, light.height, aspect)).toFixed(2)}, dark ${diff(darkImg, pd, placement(darkImg.width, darkImg.height, aspect)).toFixed(2)}`);
    }

    // ---------------------------------------------------------------- publish a product: the public site shows the watermarked image
    await a.getByRole('textbox', { name: 'Product name', exact: true }).fill('Watermark Test Ring');
    await a.locator('label:has-text("Price (USD)") input').fill('777');
    await a.click('button:has-text("Create product")');
    await a.waitForURL(/created=1/, { timeout: 30000 });
    productId = a.url().split('/admin/products/')[1].split('?')[0];
    ok('product saved with no extra steps', !!productId);
    const shop = await ctx.newPage();
    await shop.goto(BASE + '/product/watermark-test-ring', { waitUntil: 'load' });
    await shop.waitForTimeout(800);
    const imgSrcs = await shop.locator('main img').evaluateAll((els) => els.map((e) => decodeURIComponent(e.currentSrc || e.src)));
    const mediaSrcs = imgSrcs.filter((s) => s.includes('/media/'));
    ok('public product page uses the watermarked images', mediaSrcs.length > 0 && mediaSrcs.every((s) => new RegExp(`/media/m[a-f0-9]{16}/${REV}`).test(s)), mediaSrcs[0]);
    ok('public product page images load', await shop.locator('main img').first().evaluate((i) => i.complete && i.naturalWidth > 0));
    await shop.close();

    // ---------------------------------------------------------------- images uploaded before watermarking existed
    const legacyPlain = await sharp(src).resize(1200, 1500).webp({ quality: 84 }).toBuffer();
    const legacyId = 'm' + Array.from({ length: 16 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    await q("INSERT INTO media (id, content_type, width, height, bytes, created_at, purpose, watermark) VALUES ($1, 'image/webp', 1200, 1500, $2, $3, 'product', NULL)", [legacyId, legacyPlain, Date.now()]);
    const first = await (await a.request.get(`${BASE}/media/${legacyId}/${REV}`)).body();
    const [orig] = await q('SELECT bytes FROM media_originals WHERE media_id = $1', [legacyId]);
    ok('existing upload: its image is preserved as the original before watermarking', orig && buf(orig.bytes).equals(legacyPlain));
    const [after] = await q('SELECT watermark FROM media WHERE id = $1', [legacyId]);
    ok('existing upload: watermarked automatically on first view', after.watermark === REV && diff(await raw(first), await raw(legacyPlain), placement(1200, 1500, aspect)) > 1.2);
    // Run the watermarking again (a product save always re-checks its images) and view again: nothing stacks.
    await q('UPDATE media SET watermark = NULL WHERE id = $1', [legacyId]); // pretend it was never processed
    const second = await (await a.request.get(`${BASE}/media/${legacyId}/${REV}`)).body();
    const [orig2] = await q('SELECT bytes FROM media_originals WHERE media_id = $1', [legacyId]);
    ok('watermarking again never stacks a second watermark (rebuilt from the original)', second.equals(first), `${first.length} vs ${second.length} bytes`);
    ok('re-processing never replaces the preserved original', buf(orig2.bytes).equals(legacyPlain));
    const plainUrl = await a.request.get(`${BASE}/media/${legacyId}`);
    ok('the plain /media/<id> address also serves the watermarked image', (await plainUrl.body()).equals(first));
    const old = await a.request.get(`${BASE}/media/${legacyId}/w0`, { maxRedirects: 0 });
    ok('an address from another watermark revision redirects to the current one', old.status() === 308 && old.headers()['location'].endsWith(`/media/${legacyId}/${REV}`));
    await q('DELETE FROM media WHERE id = $1', [legacyId]);
    await q('DELETE FROM media_originals WHERE media_id = $1', [legacyId]);

    // ---------------------------------------------------------------- homepage hero images are not watermarked
    await a.goto(BASE + '/admin/settings', { waitUntil: 'networkidle' });
    await a.waitForTimeout(800); // let the page become interactive before choosing a file
    const heroInput = a.locator('input[type=file]').first();
    await heroInput.setInputFiles(path.join(dir, 'landscape.webp'));
    await a.waitForSelector('text=Published — the homepage now uses this image.', { timeout: 60000 }).catch(() => {});
    const [hero] = await q("SELECT id, purpose, watermark FROM media ORDER BY created_at DESC LIMIT 1");
    const heroServed = await raw(await (await a.request.get(`${BASE}/media/${hero.id}/${REV}`)).body());
    const heroPlain = await raw(await sharp(files['landscape.webp']).resize({ width: 2800, height: 2800, fit: 'inside', withoutEnlargement: true }).toBuffer());
    // the same photo uploaded as a product image (watermarked) changes far more there than compression alone does
    const heroBox = diff(heroServed, heroPlain, placement(heroServed.width, heroServed.height, aspect));
    const asProduct = await raw(await (await a.request.get(`${BASE}/media/${uploaded['landscape.webp']}/${REV}`)).body());
    const asProductPlain = await plainDisplay(files['landscape.webp']);
    const marked = diff(asProduct, asProductPlain, placement(asProduct.width, asProduct.height, aspect));
    ok('homepage hero upload is not watermarked', hero.purpose === 'hero' && hero.watermark == null && heroBox < marked / 4, `where a watermark would go ${heroBox.toFixed(2)} (compression only), a watermarked copy ${marked.toFixed(2)}`);
    ok('hero images are not offered as product images', !(await (await a.request.get(`${BASE}/admin/products/new`)).text()).includes(hero.id));
    // put the homepage back as it was
    await a.locator('button:has-text("Use the campaign image")').first().click().catch(() => {});
    await a.waitForSelector('text=Restored the campaign image.', { timeout: 20000 }).catch(() => {});

    // ---------------------------------------------------------------- built-in product photos
    const pdp = await (await a.request.get(`${BASE}/product/maison-signet-ring`)).text();
    ok('built-in product photos are published watermarked', pdp.includes(`maison-signet-1.${REV}.webp`) && !/products%2Fmaison-signet-1\.webp|products\/maison-signet-1\.webp/.test(pdp));
    const unwatermarked = await a.request.get(`${BASE}/images/laluxurygold/products/maison-signet-1.webp`);
    ok('unwatermarked originals are not downloadable from the website', unwatermarked.status() === 404, String(unwatermarked.status()));
    const builtIn = await raw(await (await a.request.get(`${BASE}/images/laluxurygold/products/maison-signet-1.${REV}.webp`)).body());
    const builtInOriginal = await raw(path.join(ROOT, 'assets/originals/products/maison-signet-1.webp'));
    ok('built-in watermark matches uploads (same logo, size, place)', diff(builtIn, builtInOriginal, placement(1200, 1500, aspect)) > 1.2 && diff(builtIn, builtInOriginal, { left: 0, top: 0, width: 1200, height: 600 }) < 1.5);
  } catch (e) {
    ok('test run finished without exceptions', false, e.message.split('\n')[0]);
  } finally {
    if (productId) {
      await a.goto(`${BASE}/admin/products/${productId}`, { waitUntil: 'load' }).catch(() => {});
      await a.locator('button:has-text("Delete")').click().catch(() => {});
      await a.waitForURL(/\/admin\/products$/, { timeout: 15000 }).catch(() => {});
    }
  }
  ok('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  if (pg) await pg.end();
  fs.rmSync(dir, { recursive: true, force: true });
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} watermark checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
