// AI product-name suggestions in the admin, against the stand-in AI server (tests/mock-ai.cjs).
//   node tests/mock-ai.cjs &
// Gemini (default):  start the site with GEMINI_API_KEY=test-key GEMINI_BASE_URL=http://localhost:4020
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/naming-e2e.cjs
// Claude:            start the site with ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://localhost:4020
//   PROVIDER=claude BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/naming-e2e.cjs
// Creates test products (deleted at the end).
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3100';
const MOCK = process.env.MOCK || 'http://localhost:4020';
const PROVIDER = process.env.PROVIDER || 'gemini';
const PASS = process.env.ADMIN_PASSWORD || 'test-admin-pass-123';
const ROOT = path.join(__dirname, '..');
const PHOTO = path.join(ROOT, 'assets/originals/products/goutte-teardrop-pendant-1.webp');
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const mock = async (p, body) => (await fetch(MOCK + p, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined)).json();

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  const a = await ctx.newPage();
  a.on('dialog', (d) => d.accept());
  const errors = [];
  a.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  const created = [];
  const review = a.locator('[data-testid=name-review]');
  const suggestedName = () => review.locator('[data-testid=suggested-name]').textContent().then((t) => t.trim());
  const nameField = a.getByPlaceholder('e.g. Aurelia Necklace');
  const waitIdle = () => a.waitForFunction(() => !document.querySelector('[data-testid=name-review] .animate-spin'), null, { timeout: 30000 });
  const newProduct = async () => {
    await a.goto(BASE + '/admin/products/new', { waitUntil: 'networkidle' });
    await a.waitForTimeout(600);
  };
  const uploadPhoto = async () => {
    await a.locator('input[type=file]').setInputFiles(PHOTO);
    await review.waitFor({ timeout: 30000 });
    await waitIdle();
  };

  try {
    await a.goto(BASE + '/admin/products/new');
    await a.fill('input[name=password]', PASS);
    await a.click('button:has-text("Sign in")');
    await a.waitForURL(/\/admin\/products\/new/);
    await a.waitForTimeout(600);

    // ---------------------------------------------------------------- selecting a photo triggers a suggestion
    await mock('/__mode', { mode: 'ok' });
    await mock('/__reset', {});
    await uploadPhoto();
    const first = await suggestedName();
    ok('selecting a photo produces a name suggestion automatically', !!first, first);
    ok('the suggestion is short (2–4 words)', first.split(/\s+/).length >= 2 && first.split(/\s+/).length <= 4);
    ok('the suggestion names the type of piece', /pendant/i.test(first) && /Pendant/.test(await review.textContent()));
    ok('the suggestion is NOT put into the product name until approved', (await nameField.inputValue()) === '' && (await a.locator('[data-testid=name-status]').textContent()).includes('No product name yet'));
    ok('review shows the selected photo', (await review.locator('img').count()) === 1);

    // what the site sent to the model
    const [req] = await mock('/__requests');
    if (PROVIDER === 'gemini') {
      ok('request goes to Gemini (gemini-3.8-flash) from the server, with the photo', req.provider === 'gemini' && req.model === 'gemini-3.8-flash' && req.image?.media_type === 'image/jpeg', JSON.stringify(req.image));
      ok('the Gemini key travels only server to Google (x-goog-api-key)', req.apiKeyHeader === true);
      ok('Gemini 3 models are asked for low thinking (quick answers)', req.thinkingLevel === 'LOW', String(req.thinkingLevel));
    } else {
      ok('request goes to Claude Opus 5.5 from the server, with the photo', req.provider === 'claude' && req.model === 'claude-opus-5-5' && req.image?.media_type === 'image/jpeg', JSON.stringify(req.image));
    }
    ok('structured output (name, kind, visible features)', req.format === 'json_schema' && ['is_jewellery', 'kind', 'visible_features', 'name'].every((f) => req.schemaFields.includes(f)));
    if (PROVIDER === 'claude') ok('refusal fallback enabled', req.fallbacks === 'default' && req.beta.includes('server-side-fallback-2026-07-01'));
    ok('naming brief forbids purity/weight/gemstone claims and long descriptions', /purity or karat, weight/.test(req.system) && /two to four words/.test(req.system));
    ok('existing product names are avoided', req.text.includes('Maison Signet Ring'));
    // the photo analysed is the unwatermarked original, not the watermarked web image
    {
      const sent = await sharp(Buffer.from(await (await fetch(MOCK + '/__last-image')).arrayBuffer())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const orig = await sharp(PHOTO).resize(sent.info.width, sent.info.height).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const { placement } = await import('../src/lib/watermark/core.ts');
      const box = placement(sent.info.width, sent.info.height, 1.4);
      let d = 0, n = 0;
      for (let y = box.top; y < box.top + box.height; y++) for (let x = box.left; x < box.left + box.width; x++) { const i = (y * sent.info.width + x) * 3; d += Math.abs(sent.data[i] - orig.data[i]) + Math.abs(sent.data[i + 1] - orig.data[i + 1]) + Math.abs(sent.data[i + 2] - orig.data[i + 2]); n += 3; }
      ok('the AI analyses the original photo (no watermark in it)', d / n < 2.5, `difference in watermark corner ${(d / n).toFixed(2)}`);
    }

    // ---------------------------------------------------------------- regenerate: different names, never repeated, same kind
    const names = [first];
    for (let i = 0; i < 3; i++) {
      await review.locator('button:has-text("Regenerate")').click();
      await a.waitForTimeout(50);
      await waitIdle();
      names.push(await suggestedName());
    }
    ok('regenerate gives a different name each time, never repeating this session', new Set(names).size === names.length, names.join(' → '));
    const reqs = await mock('/__requests');
    ok('regenerate keeps the same photo and type of piece', reqs.length === 4 && reqs.slice(1).every((r) => r.image && /kind "pendant"/.test(r.text)));
    ok('regenerate tells the model every earlier suggestion', names.slice(0, 3).every((n) => reqs[3].text.includes(n)));
    ok('regenerating does not set the product name', (await nameField.inputValue()) === '');

    // ---------------------------------------------------------------- cannot save an unreviewed name
    await a.locator('label:has-text("Price (USD)") input').fill('640');
    await a.click('button:has-text("Create product")');
    await a.waitForTimeout(800);
    ok('the product cannot be created until a name is approved', a.url().includes('/products/new') && (await a.locator('main').textContent()).includes('Approve the suggested name'));

    // ---------------------------------------------------------------- manual name wins
    await nameField.fill('My Own Pendant');
    await review.locator('button:has-text("Regenerate")').click();
    await a.waitForTimeout(50);
    await waitIdle();
    ok('a typed name is kept when regenerating', (await nameField.inputValue()) === 'My Own Pendant' && (await a.locator('[data-testid=name-status]').textContent()).includes('your own name'));
    const current = await suggestedName();
    await review.locator('button:has-text("Use this name instead")').click();
    ok('the admin can explicitly choose the suggestion instead', (await nameField.inputValue()) === current && (await a.locator('[data-testid=name-status]').textContent()).includes('approved'));

    // ---------------------------------------------------------------- edit the suggestion
    await review.locator('button:has-text("Edit name")').click();
    const edit = review.getByRole('textbox', { name: 'Edit the product name' });
    await edit.fill('Rosée Test Pendant');
    await review.locator('button:has-text("Save name")').click();
    ok('an edited name becomes the product name', (await nameField.inputValue()) === 'Rosée Test Pendant');
    ok('web address follows the approved name', (await a.locator('input.font-mono').inputValue()) === 'rosee-test-pendant');

    // ---------------------------------------------------------------- save and publish
    await a.click('button:has-text("Create product")');
    await a.waitForURL(/created=1/, { timeout: 30000 });
    created.push(a.url().split('/admin/products/')[1].split('?')[0]);
    ok('product saved with the approved name', true);
    const shop = await ctx.newPage();
    await shop.goto(BASE + '/product/rosee-test-pendant', { waitUntil: 'load' });
    await shop.waitForTimeout(600);
    ok('public product page shows the approved name', (await shop.locator('h1').first().textContent()).includes('Rosée Test Pendant'));
    const src = await shop.locator('main img').first().evaluate((i) => decodeURIComponent(i.currentSrc || i.src));
    ok('public page shows the watermarked image (watermarking still automatic)', /\/media\/m[a-f0-9]{16}\/w1/.test(src), src.slice(0, 90));
    const img = await shop.request.get(src);
    ok('watermarked image loads', img.status() === 200);
    await shop.close();

    // ---------------------------------------------------------------- duplicates of existing products are rejected
    await newProduct();
    await mock('/__reset', {});
    await mock('/__mode', { mode: 'dup-first' });
    await uploadPhoto();
    const dupReqs = await mock('/__requests');
    const dupName = await suggestedName();
    ok('a suggestion that copies an existing product name is rejected and replaced', dupName !== 'Maison Signet Ring' && dupReqs.length === 2 && /could not be used because/.test(dupReqs[1].text), `${dupName}; ${dupReqs.length} requests`);
    ok('the replacement also avoids names already used on the store', !dupName.includes('Rosée Test'));

    // ---------------------------------------------------------------- AI failure never blocks manual naming
    await newProduct();
    await mock('/__mode', { mode: 'fail' });
    await uploadPhoto();
    const failText = await review.textContent();
    ok('AI failure shows a calm message and offers a retry', /unavailable right now/.test(failText) && (await review.locator('button:has-text("Try again")').count()) === 1, failText.slice(0, 120));
    await nameField.fill('Hand Named Pendant');
    await a.locator('label:has-text("Price (USD)") input').fill('500');
    await a.click('button:has-text("Create product")');
    await a.waitForURL(/created=1/, { timeout: 30000 });
    created.push(a.url().split('/admin/products/')[1].split('?')[0]);
    ok('a product can still be created with a manual name when the AI is down', (await a.locator('h1').first().textContent()).includes('Hand Named Pendant'));

    // ---------------------------------------------------------------- not a jewellery photo
    await newProduct();
    await mock('/__mode', { mode: 'not-jewellery' });
    await uploadPhoto();
    ok('a photo without jewellery gets no name, just a note', (await review.textContent()).includes('doesn’t seem to show a piece of jewellery') && (await review.locator('[data-testid=suggested-name]').count()) === 0);

    // ---------------------------------------------------------------- Gemini: a busy or unusable model is skipped
    // (the site runs with GEMINI_REST_MS=4000: a busy model rests for 4 s instead of 15 minutes)
    if (PROVIDER === 'gemini') {
      const rested = () => a.waitForTimeout(4500);
      await rested();
      await newProduct();
      await mock('/__reset', {});
      await mock('/__mode', { mode: 'model-503' });
      await uploadPhoto();
      const busy = (await mock('/__requests')).map((r) => r.model);
      ok('if the Gemini model is overloaded (503), it is not retried: the next model is asked at once', !!(await suggestedName().catch(() => '')) && busy.join() === 'gemini-3.8-flash,gemini-flash-latest', busy.join(' → '));
      await mock('/__reset', {});
      await review.locator('button:has-text("Regenerate")').click();
      await waitIdle();
      const skipped = (await mock('/__requests')).map((r) => r.model);
      ok('while it is busy, the busy model is skipped: the model that answered is asked first', !!(await suggestedName().catch(() => '')) && skipped.length > 0 && skipped.every((m) => m === 'gemini-flash-latest'), skipped.join(' → '));
      await rested();
      await newProduct();
      await mock('/__reset', {});
      await mock('/__mode', { mode: 'ok' });
      await uploadPhoto();
      const back = (await mock('/__requests')).map((r) => r.model);
      ok('once its rest is over, the preferred model is asked first again', !!(await suggestedName().catch(() => '')) && back[0] === 'gemini-3.8-flash', back.join(' → '));
      await rested();
      await newProduct();
      await mock('/__reset', {});
      await mock('/__mode', { mode: 'model-504' });
      const t504 = Date.now();
      await uploadPhoto();
      const late = (await mock('/__requests')).map((r) => r.model);
      ok('if the Gemini model times out (504), the next model is used', !!(await suggestedName().catch(() => '')) && late.join() === 'gemini-3.8-flash,gemini-flash-latest' && Date.now() - t504 < 15000, `${late.join(' → ')} in ${Date.now() - t504} ms`);
      await rested();
      await newProduct();
      await mock('/__reset', {});
      await mock('/__mode', { mode: 'all-busy' });
      await uploadPhoto();
      const listedRun = (await mock('/__requests')).map((r) => r.model);
      ok('if the usual models are all busy, another model from Google\u2019s list is used (retired ones skipped)', !!(await suggestedName().catch(() => '')) && listedRun.at(-1) === 'gemini-3.8-flash-lite' && !listedRun.includes('gemini-3.8-flash-image'), listedRun.join(' → '));
      await mock('/__reset', {});
      await review.locator('button:has-text("Regenerate")').click();
      await waitIdle();
      const direct = (await mock('/__requests')).map((r) => r.model);
      ok('the next suggestion goes straight to the model that answered', !!(await suggestedName().catch(() => '')) && direct.length > 0 && direct.every((m) => m === 'gemini-3.8-flash-lite'), direct.join(' → '));
      await rested();
      await newProduct();
      await mock('/__reset', {});
      await mock('/__mode', { mode: 'model-404' });
      await uploadPhoto();
      const used = (await mock('/__requests')).map((r) => r.model);
      ok('if the configured Gemini model is unavailable, the next model is used', !!(await suggestedName().catch(() => '')) && used[0] === 'gemini-3.8-flash' && used.length >= 2, used.join(' → '));
      await mock('/__mode', { mode: 'fail' });
      await newProduct();
      await uploadPhoto();
      ok('a failure shows the provider\u2019s reason to the admin', /Gemini 500/.test(await review.textContent()));
    }

    // ---------------------------------------------------------------- existing products: suggestions only on request
    await mock('/__mode', { mode: 'ok' });
    await a.goto(BASE + '/admin/products/p-ring-signet', { waitUntil: 'networkidle' });
    await a.waitForTimeout(500);
    ok('editing an existing product does not suggest names unasked', (await review.count()) === 0 && (await a.locator('button:has-text("Suggest a name from the main photo")').count()) === 1);
    await a.locator('button:has-text("Suggest a name from the main photo")').click();
    await review.waitFor({ timeout: 30000 });
    await waitIdle();
    ok('a suggestion can be requested for built-in product photos too', !!(await suggestedName()) && (await nameField.inputValue()) === 'Maison Signet Ring');
  } catch (e) {
    ok('test run finished without exceptions', false, e.message.split('\n')[0]);
  } finally {
    await mock('/__mode', { mode: 'ok' }).catch(() => {});
    for (const id of created) {
      await a.goto(`${BASE}/admin/products/${id}`, { waitUntil: 'load' }).catch(() => {});
      await a.locator('button:has-text("Delete")').click().catch(() => {});
      await a.waitForURL(/\/admin\/products$/, { timeout: 15000 }).catch(() => {});
    }
  }
  ok('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} naming checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
