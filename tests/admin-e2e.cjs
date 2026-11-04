// End-to-end checks for the admin panel. Run against `npm start` with ADMIN_PASSWORD set.
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/admin-e2e.cjs
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3100';
const PASS = process.env.ADMIN_PASSWORD || 'test-admin-pass-123';
const SHOTS = process.env.SHOTS || '';
const results = [];
const RUN = Date.now().toString(36);
const BUYER = `amira+${RUN}@example.com`;
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

(async () => {
  const b = await chromium.launch();
  const shopper = await b.newContext({ ...devices['iPhone 13'] });
  const admin = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const s = await shopper.newPage();
  const a = await admin.newPage();
  const errors = [];
  a.on('pageerror', (e) => errors.push(a.url().replace(BASE, '') + ': ' + e.message.slice(0, 60)));

  // ---------------------------------------------------------------- auth
  const r = await a.goto(BASE + '/admin/orders');
  ok('unauthenticated admin redirects to login', a.url().includes('/admin/login'));
  await a.fill('input[name=password]', 'wrong-password');
  await a.click('button:has-text("Sign in")');
  await a.waitForSelector('text=Incorrect password.');
  ok('wrong password rejected', true);
  await a.fill('input[name=password]', PASS);
  await a.click('button:has-text("Sign in")');
  await a.waitForURL(/\/admin\/orders/);
  ok('login redirects back to requested page', a.url().endsWith('/admin/orders'));

  // ---------------------------------------------------------------- visitors
  for (const p of ['/', '/shop', '/product/classic-gold-hoops']) { await s.goto(BASE + p, { waitUntil: 'load' });
  await s.waitForTimeout(700); await s.waitForTimeout(400); }
  await a.goto(BASE + '/admin', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  await a.waitForTimeout(1500);
  const liveText = await a.locator('aside').first().textContent();
  ok('sidebar shows live visitor count ≥ 1', /([1-9]\d*)\s*on the site now/.test(liveText), liveText.match(/\d+\s*on the site now/)?.[0]);
  ok('live panel lists the shopper on the product page', await a.getByText('/product/classic-gold-hoops').first().isVisible());
  const visitorsToday = await a.locator('p:has-text("Visitors today") + p').textContent();
  ok('visitors today ≥ 1', Number(visitorsToday) >= 1, visitorsToday);

  // admin's own visit to the store is not counted
  const before = await (await a.request.get(BASE + '/api/admin/live')).json();
  const adminStore = await admin.newPage();
  await adminStore.goto(BASE + '/about', { waitUntil: 'load' });
  await adminStore.waitForTimeout(500);
  const after = await (await a.request.get(BASE + '/api/admin/live')).json();
  ok("admin's own store visits are not tracked", !after.live.some((v) => v.path === '/about'));
  await adminStore.close();

  // ---------------------------------------------------------------- order → live alert
  await s.goto(BASE + '/product/maison-signet-ring', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  await s.locator('main button[aria-pressed]:has-text("54")').click();
  await s.locator('main button:has-text("Buy now")').click();
  await s.waitForURL(/checkout/);
  await s.fill('input[name=email]', BUYER);
  await s.fill('input[name=phone]', '+971 50 123 4567');
  await s.fill('input[name=firstName]', 'Amira');
  await s.fill('input[name=lastName]', 'Test');
  await s.fill('input[name=address1]', '12 Marina Walk');
  await s.fill('input[name=city]', 'Dubai');
  await s.click('button:has-text("Submit order request")');
  await s.waitForSelector('text=Order request received');
  const ref = (await s.locator('strong:has-text("LLG-")').textContent()).trim();
  ok('shopper order placed', /^LLG-/.test(ref), ref);

  const toast = a.locator(`text=${ref}`).first();
  await toast.waitFor({ timeout: 20000 }).catch(() => {});
  ok('admin gets a live “New order” alert without refreshing', await toast.isVisible());
  if (SHOTS) await a.screenshot({ path: path.join(SHOTS, 'admin-toast.png') });

  await a.goto(BASE + '/admin/orders', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  ok('order appears in orders list with amount', (await a.locator(`tr:has-text("${ref}")`).textContent()).includes('$925'));
  await a.click(`a:has-text("${ref}")`);
  await a.waitForURL(new RegExp(ref));
  ok('order detail shows buyer & item', (await a.locator('main').textContent()).includes(BUYER) && (await a.locator('main').textContent()).includes('Maison Signet Ring'));
  await a.selectOption('select[name=status]', 'paid');
  await a.fill('input[name=note]', 'Paid by bank transfer');
  await a.click('button:has-text("Update status")');
  await a.waitForSelector('text=Status updated.');
  await a.reload({ waitUntil: 'load' });
  await a.waitForTimeout(800);
  ok('status change saved with note in history', (await a.locator('main').textContent()).includes('Paid by bank transfer'));

  await a.goto(BASE + '/admin/customers', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  const buyerRow = await a.locator(`tr:has-text("${BUYER}")`).textContent();
  ok('buyer listed with total paid', buyerRow.includes('$925'), buyerRow.replace(/\s+/g, ' ').slice(0, 120));
  await a.goto(BASE + '/admin', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  const revenue = await a.locator('p:has-text("Revenue received") + p').textContent();
  ok('dashboard revenue includes paid order', Number(revenue.replace(/[^\d]/g, '')) >= 925, revenue);
  if (SHOTS) { await a.waitForTimeout(1200); await a.screenshot({ path: path.join(SHOTS, 'admin-dashboard.png'), fullPage: true }); }

  const csv = await a.request.get(BASE + '/api/admin/export/orders');
  ok('orders CSV export', csv.status() === 200 && (await csv.text()).includes(ref));

  // ---------------------------------------------------------------- products
  await a.goto(BASE + '/admin/products', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  ok('products list shows catalogue', (await a.locator('tbody tr').count()) >= 19);
  await a.click('a:has-text("Classic Gold Hoops")');
  await a.waitForURL(/\/admin\/products\/p-/);
  await a.locator('label:has-text("Price (USD)") input').fill('560');
  await a.locator('label:has-text("Short tagline") input').fill('Rounded hoops — edited from the admin.');
  await a.click('button:has-text("Save changes")');
  await a.waitForSelector('text=Saved and published to the store.');
  await s.goto(BASE + '/product/classic-gold-hoops', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  const pdp = await s.locator('main').textContent();
  ok('product edit is live on the store (price + tagline)', pdp.includes('$560') && pdp.includes('edited from the admin'));

  // create a product with an uploaded image
  await a.goto(BASE + '/admin/products/new', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  await a.getByRole('textbox', { name: 'Product name', exact: true }).fill('Test Admin Ring');
  await a.locator('label:has-text("Price (USD)") input').fill('999');
  await a.locator('input[type=file]').setInputFiles(path.join(__dirname, '..', 'public', 'images', 'products', 'soleil-dome-3.webp'));
  await a.waitForSelector('span:has-text("Main")', { timeout: 20000 });
  ok('image upload works', true);
  await a.click('button:has-text("Create product")');
  await a.waitForURL(/created=1/, { timeout: 20000 });
  const newId = a.url().split('/admin/products/')[1].split('?')[0];
  await s.goto(BASE + '/product/test-admin-ring', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  ok('new product page is live', (await s.locator('main').textContent()).includes('Test Admin Ring'));
  const img = await s.locator('main img').first().evaluate((i) => i.complete && i.naturalWidth > 0);
  ok('uploaded image displays on store', img);
  await s.goto(BASE + '/shop?q=test%20admin', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  ok('new product appears in shop search', (await s.locator('main ul.grid > li:visible').count()) === 1);

  // hide it, then delete
  await a.click('button:has-text("Hide from store")');
  await a.waitForSelector('text=This product is hidden from the store.', { timeout: 20000 });
  // The first request after a change may still be served from cache while it refreshes.
  let hidden = await s.goto(BASE + '/product/test-admin-ring');
  if (hidden.status() !== 404) hidden = await s.goto(BASE + '/product/test-admin-ring');
  ok('hidden product is removed from store (404)', hidden.status() === 404);
  const orderHidden = await s.request.post(BASE + '/api/orders', { data: { customer: { email: 'x@example.com', phone: '+971500000000', firstName: 'X', lastName: 'Y' }, shipping: { address1: 'a', city: 'Dubai', country: 'AE' }, shippingMethodId: 'uae-delivery', paymentMethod: 'order-request', lines: [{ productId: newId, quantity: 1 }] } });
  ok('hidden product cannot be ordered', orderHidden.status() === 422);
  a.once('dialog', (d) => d.accept());
  await a.click('button:has-text("Delete")');
  await a.waitForURL(/\/admin\/products$/);
  await a.goto(BASE + '/admin/products?view=archived', { waitUntil: 'domcontentloaded' });
  await a.waitForSelector('main table');
  ok('product deleted', !(await a.locator('text=Test Admin Ring').count()));

  // ---------------------------------------------------------------- messages & subscribers
  await s.goto(BASE + '/contact', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  await s.fill('input[name=name]', 'Layla');
  await s.fill('input[name=email]', 'layla@example.com');
  await s.fill('textarea[name=message]', `Do you offer engraving on signet rings? (${RUN})`);
  await s.click('button:has-text("Send message")');
  await s.waitForSelector('text=our team will be in touch');
  await a.goto(BASE + '/admin/messages', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  ok('contact message appears in admin', await a.getByText(`(${RUN})`).isVisible());
  await a.goto(BASE + '/admin/visitors?range=today', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  ok('visit log lists shopper page views', (await a.locator('tbody tr').count()) >= 3);
  if (SHOTS) await a.screenshot({ path: path.join(SHOTS, 'admin-visitors.png'), fullPage: true });

  // restore the edited product so repeated runs start from the same data
  await a.goto(BASE + '/admin/products', { waitUntil: 'load' });
  await a.waitForTimeout(800);
  await a.click('a:has-text("Classic Gold Hoops")');
  await a.waitForURL(/\/admin\/products\/p-/);
  await a.locator('label:has-text("Price (USD)") input').fill('530');
  await a.locator('label:has-text("Short tagline") input').fill('Rounded, tapered hoops — the essential pair.');
  await a.click('button:has-text("Save changes")');
  await a.waitForSelector('text=Saved and published to the store.');

  // ---------------------------------------------------------------- homepage hero
  await a.goto(BASE + '/admin/settings', { waitUntil: 'load' });
  await a.waitForTimeout(700);
  await a.locator('input[aria-label="Upload Hero background — desktop"]').setInputFiles(path.join(__dirname, '..', 'public', 'images', 'editorial', 'campaign.webp'));
  await a.waitForSelector('text=Published — the homepage now uses this image.', { timeout: 30000 });
  let heroSrc = '';
  for (let i = 0; i < 2 && !heroSrc.includes('%2Fmedia%2F'); i++) {
    await s.goto(BASE + '/', { waitUntil: 'load' });
    heroSrc = (await s.locator('section[aria-label=Introduction] picture img').first().getAttribute('src')) ?? '';
  }
  ok('uploaded hero image is used on the homepage', heroSrc.includes('%2Fmedia%2F'), heroSrc.slice(0, 80));
  await a.click('button:has-text("Use the campaign image")');
  await a.waitForSelector('text=Restored the campaign image.');

  // ---------------------------------------------------------------- exchange rate
  await a.goto(BASE + '/admin/settings', { waitUntil: 'load' });
  await a.waitForTimeout(500);
  const rateInput = a.locator('input[name=ngnPerUsd]');
  const oldRate = await rateInput.inputValue();
  await rateInput.fill('1600');
  await a.click('button:has-text("Save rate")');
  await a.waitForSelector('text=Saved — naira prices');
  await s.goto(BASE + '/product/classic-gold-hoops', { waitUntil: 'load' });
  await s.evaluate(() => localStorage.setItem('llg.currency.v2', JSON.stringify('NGN')));
  let ngnText = '';
  for (let i = 0; i < 3 && !ngnText.includes('848,000'); i++) {
    await s.reload({ waitUntil: 'load' });
    await s.waitForTimeout(700);
    ngnText = await s.locator('main').textContent();
  }
  ok('naira rate from Store settings is used on the store ($530 × 1600)', ngnText.includes('848,000'), (ngnText.match(/₦[\d,]+/) || [''])[0]);
  await s.evaluate(() => localStorage.setItem('llg.currency.v2', JSON.stringify('USD')));
  await rateInput.fill(oldRate);
  await a.click('button:has-text("Save rate")');
  await a.waitForSelector('text=Saved — naira prices');

  // ---------------------------------------------------------------- testimonials
  await a.goto(BASE + '/admin/testimonials', { waitUntil: 'load' });
  await a.waitForTimeout(500);
  await a.click('button:has-text("Add testimonial")');
  await a.fill('textarea[name=quote]', `Beautiful ring and very helpful team on WhatsApp. (${RUN})`);
  await a.fill('input[name=name]', 'Test Client');
  await a.click('button:has-text("Save testimonial")');
  await a.waitForSelector(`text=(${RUN})`);
  let homeText = '';
  for (let i = 0; i < 3 && !homeText.includes(RUN); i++) {
    await s.goto(BASE + '/', { waitUntil: 'load' });
    await s.waitForTimeout(700);
    homeText = await s.locator('main').textContent();
  }
  ok('published testimonial appears on the homepage', homeText.includes(RUN));
  a.once('dialog', (d) => d.accept());
  await a.locator(`li:has-text("(${RUN})") button[aria-label=Delete]`).click();
  await a.waitForSelector(`text=(${RUN})`, { state: 'detached' });
  await s.goto(BASE + '/', { waitUntil: 'load' });
  await s.waitForTimeout(700);
  ok('testimonials section hidden when none are published', !(await s.locator('section[aria-labelledby=testimonials]').count()));

  // ---------------------------------------------------------------- logout
  await a.click('button:has-text("Sign out")');
  await a.waitForURL(/\/admin\/login/);
  const after2 = await a.request.get(BASE + '/api/admin/live');
  ok('sign out ends the session', after2.status() === 401);
  ok('no client errors in admin', errors.length === 0, errors.slice(0, 3).join(' | '));

  await b.close();
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} admin checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
