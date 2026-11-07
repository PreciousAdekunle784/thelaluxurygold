// End-to-end checks for The Private Collection: invitation codes, access sessions and that private
// products never leak into the public store. Run against `npm start` with ADMIN_PASSWORD set:
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/private-e2e.cjs
// It marks "Petite Huggie Earrings" private for the run and makes it public again at the end.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3100';
const PASS = process.env.ADMIN_PASSWORD || 'test-admin-pass-123';
const PRODUCT_ID = 'p-ear-huggies';
const SLUG = 'petite-huggie-earrings';
const NAME = 'Petite Huggie Earrings';
const RUN = Date.now().toString(36);
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
// a distinct (fake) client address per context, so the rate limiter treats each as its own visitor
const ip = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

(async () => {
  const b = await chromium.launch();
  const admin = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const a = await admin.newPage();
  const newGuest = async () => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, extraHTTPHeaders: { 'x-forwarded-for': ip() } });
    return { ctx, page: await ctx.newPage() };
  };
  const errors = [];
  a.on('dialog', (d) => d.accept());
  // Pages the visitor may not see redirect to the access page (an HTTP 307, or a streamed redirect once rendering began).
  const deniedAt = async (page, path) => {
    await page.goto(BASE + path);
    await page.waitForURL((u) => new URL(u).pathname === '/private', { timeout: 10000 }).catch(() => {});
    const text = await page.locator('body').textContent().catch(() => '');
    return new URL(page.url()).pathname === '/private' && !text.includes(NAME) && !/Beyond the ordinary/i.test(text);
  };

  const setPrivate = async (on) => {
    await a.goto(BASE + `/admin/products/${PRODUCT_ID}`, { waitUntil: 'load' });
    await a.waitForTimeout(600);
    const box = a.locator('input[name=private]');
    if ((await box.isChecked()) !== on) await box.click();
    await a.click('button:has-text("Save changes")');
    await a.waitForSelector('text=Saved and published to the store.');
  };

  const issue = async ({ name, singleUse = false }) => {
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    await a.waitForTimeout(500);
    if (await a.locator('button:has-text("Done")').count()) await a.click('button:has-text("Done")');
    await a.fill('input[name=name]', name);
    await a.fill('input[name=reference]', `TEST-${RUN}`);
    if (singleUse) await a.check('input[name=singleUse]');
    await a.click('button:has-text("Generate access code")');
    const el = a.locator('[data-testid=issued-code]');
    await el.waitFor({ timeout: 15000 });
    const code = (await el.textContent()).trim();
    await a.click('button:has-text("Done")');
    return code;
  };

  const row = (name) => a.locator(`tbody tr:has-text("${name}")`).first();
  const adminRowAction = async (name, label) => {
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    await a.waitForTimeout(500);
    await row(name).locator(`button:has-text("${label}")`).click();
    await a.waitForTimeout(1500);
  };

  const unlock = async (page, code) => {
    await page.goto(BASE + '/private', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#private-code').length === 1, null, { timeout: 15000 });
    await page.fill('#private-code', code);
    await page.click('button:has-text("Unlock private access")');
    await Promise.race([
      page.waitForURL(/\/private\/collection/, { timeout: 15000 }),
      page.waitForFunction(() => (document.querySelector('#private-error')?.textContent || '').trim().length > 0, null, { timeout: 15000 }),
    ]).catch(() => {});
    if (!page.url().includes('/private/collection')) return false;
    await page.waitForLoadState('load');
    return true;
  };

  try {
    // ---------------------------------------------------------------- admin sign-in
    await a.goto(BASE + '/admin/private');
    await a.fill('input[name=password]', PASS);
    await a.click('button:has-text("Sign in")');
    await a.waitForURL(/\/admin\/private/);
    ok('Private Access is in the admin', await a.locator('h1:has-text("Private Access Management")').waitFor({ timeout: 15000 }).then(() => true, () => false));
    for (const s of ['Active invitations', 'Used codes', 'Expired', 'Revoked']) ok(`stat “${s}” shown`, await a.locator(`text=${s}`).first().isVisible());

    // validation
    await a.click('button:has-text("Generate access code")');
    await a.waitForSelector("text=Add the customer's name");
    ok('code needs a name, email or reference', true);

    // ---------------------------------------------------------------- mark a product private
    await setPrivate(true);
    await a.goto(BASE + '/admin/products', { waitUntil: 'load' });
    ok('admin product list labels it Private', await a.locator(`tr:has-text("${NAME}") >> text=Private`).first().isVisible());

    // ---------------------------------------------------------------- unauthorised: nothing public
    const { ctx: anonCtx, page: anon } = await newGuest();
    // A page prerendered while the piece was still public may be served once more (stale-while-revalidate)
    // straight after the change; it then re-renders without the piece.
    const first = await anon.request.get(BASE + `/product/${SLUG}`);
    await anon.waitForTimeout(800);
    for (const u of ['/', '/shop', '/new-arrivals', '/collections/earrings', '/collections/everyday-gold', '/fine-jewellery', '/product/classic-gold-hoops', '/sitemap.xml', '/collections']) await anon.request.get(BASE + u);
    await anon.waitForTimeout(800);
    const pub = await anon.request.get(BASE + `/product/${SLUG}`);
    console.log(`      (first request after the change: ${first.status()})`);
    ok('public product URL of a private piece is 404', pub.status() === 404, String(pub.status()));
    for (const u of ['/', '/shop', '/new-arrivals', '/collections/earrings', '/collections/everyday-gold', '/fine-jewellery', '/product/classic-gold-hoops', '/sitemap.xml', '/collections']) {
      const res = await anon.request.get(BASE + u);
      const html = await res.text();
      ok(`${u} does not mention the private piece`, !html.includes(NAME) && !html.includes(SLUG) && !html.includes(PRODUCT_ID), String(res.status()));
    }
    await anon.goto(BASE + '/shop', { waitUntil: 'load' });
    await anon.waitForTimeout(500);
    await anon.locator('header button[aria-label="Search"]').last().click();
    await anon.fill('#site-search', 'huggie');
    await anon.waitForTimeout(700);
    ok('instant search does not find the private piece', !(await anon.locator('[role=dialog]').textContent()).includes(NAME));
    const sr = await (await anon.request.get(BASE + '/shop?q=huggie')).text();
    ok('search results page does not list the private piece', !strip(sr).includes(NAME));
    const api = await anon.request.get(BASE + '/api/private/products');
    ok('private products API refuses visitors (401)', api.status() === 401, String(api.status()));
    ok('private API leaks nothing', !(await api.text()).includes(NAME));
    ok('/private/collection redirects visitors to the access page', await deniedAt(anon, '/private/collection'));
    ok('private product page redirects visitors to the access page', await deniedAt(anon, `/private/product/${SLUG}`));
    const accessHtml = strip(await (await anon.request.get(BASE + '/private')).text());
    ok('access page exposes no private products', !accessHtml.includes(NAME) && !accessHtml.includes(SLUG));
    ok('access page is noindex', /<meta name="robots" content="noindex/.test(accessHtml));
    // forged cookie: present but not a real session
    await anonCtx.addCookies([{ name: 'llg_private', value: 'x'.repeat(43), url: BASE }, { name: 'llg_pc', value: '1', url: BASE }]);
    ok('a forged session cookie is rejected', await deniedAt(anon, '/private/collection'));
    ok('a forged session cookie cannot open a private product', await deniedAt(anon, `/private/product/${SLUG}`));
    ok('forged cookie cannot read the private API', (await anon.request.get(BASE + '/api/private/products')).status() === 401);
    await anonCtx.close();

    // ---------------------------------------------------------------- access page + invalid code
    const { ctx: gCtx, page: g } = await newGuest();
    g.on('pageerror', (e) => errors.push(e.message.slice(0, 80)));
    await g.goto(BASE + '/private', { waitUntil: 'load' });
    await g.waitForFunction(() => document.querySelectorAll('#private-code').length === 1, null, { timeout: 15000 });
    const body = await g.locator('main').textContent();
    ok('access page copy', /LaLuxuryGold · Private Access/i.test(body) && /An experience/i.test(body) && /reserved for you/i.test(body));
    ok('access page placeholder', (await g.getAttribute('#private-code', 'placeholder')) === 'Enter your private access code');
    ok('empty code cannot be submitted', (await g.getAttribute('#private-code', 'required')) !== null);
    ok('invalid code is rejected', !(await unlock(g, 'LLG-AAAA-BBBB-CCCC')));
    ok('invalid-code message is generic', (await g.textContent('#private-error')).includes("couldn't verify this access code"));

    // ---------------------------------------------------------------- valid code → collection → bag → order
    const code = await issue({ name: `Amaka ${RUN}` });
    ok('admin generates a code', /^LLG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), code);
    ok('code is listed by its last 4 characters only', (await row(`Amaka ${RUN}`).textContent()).includes(code.slice(-4)) && !(await a.content()).includes(code));
    ok('valid code unlocks the collection', await unlock(g, code.toLowerCase().replace(/-/g, ' ')), g.url());
    await g.locator('#private-title').waitFor({ timeout: 15000 }).catch(() => {});
    const coll = await g.locator('main').textContent();
    ok('collection greets the client', coll.includes(`Welcome, Amaka`));
    ok('collection headline', /Beyond the ordinary/i.test(coll) && /Reserved for you/i.test(coll));
    ok('collection lists the private piece', coll.includes(NAME));
    const cookies = await gCtx.cookies();
    const sess = cookies.find((c) => c.name === 'llg_private');
    ok('session cookie is HTTP-only', sess && sess.httpOnly && sess.value.length >= 40);
    await g.click(`main a[href="/private/product/${SLUG}"] >> nth=0`);
    await g.waitForURL(new RegExp(`/private/product/${SLUG}`));
    await g.waitForTimeout(700);
    ok('private product page opens', (await g.locator('h1').first().textContent()).includes(NAME));
    ok('private product page has WhatsApp', (await g.locator('main a[href*="wa.me"]').count()) > 0);
    const pdpHtml = await (await g.request.get(BASE + `/private/product/${SLUG}`)).text();
    ok('private product page is noindex', /<meta name="robots" content="noindex/.test(pdpHtml));
    ok('private API serves the piece to the client', (await (await g.request.get(BASE + '/api/private/products')).text()).includes(NAME));
    await g.locator('main button:has-text("Add to bag")').first().click();
    await g.waitForFunction(() => /[1-9] item/.test(document.querySelector('header button[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || ''), null, { timeout: 8000 }).catch(() => {});
    const bag = await g.locator('header button[aria-label^="Shopping bag"]').getAttribute('aria-label');
    ok('private piece added to bag', /1 item/.test(bag), bag);
    await g.goto(BASE + '/checkout', { waitUntil: 'load' });
    await g.waitForTimeout(900);
    ok('checkout shows the private piece', (await g.locator('main').textContent()).includes(NAME));
    await g.fill('input[name=email]', `private+${RUN}@example.com`);
    await g.fill('input[name=phone]', '+971 50 123 4567');
    await g.fill('input[name=firstName]', 'Amaka');
    await g.fill('input[name=lastName]', 'Test');
    await g.fill('input[name=address1]', '12 Marina Walk');
    await g.fill('input[name=city]', 'Dubai');
    if (await g.locator('input[value=order-request]').count()) await g.locator('label:has(input[value=order-request])').click();
    const [resp] = await Promise.all([g.waitForResponse((r) => r.url().includes('/api/orders')), g.click('button:has-text("Submit order request")')]);
    ok('client can order a private piece', resp.status() === 201, String(resp.status()));
    // the very same order, replayed by someone without access, is refused because of the private piece
    const payload = resp.request().postDataJSON();
    const { ctx: xCtx, page: x } = await newGuest();
    const replay = await x.request.post(BASE + '/api/orders', { data: payload });
    const rj = await replay.json().catch(() => ({}));
    ok('orders for a private piece are refused without access', replay.status() === 422 && Object.keys(rj.fields || {}).join() === 'lines', `${replay.status()} ${JSON.stringify(rj.fields)}`);
    await xCtx.close();

    // ---------------------------------------------------------------- admin sees usage
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    const r1 = await row(`Amaka ${RUN}`).textContent();
    ok('admin sees usage and an active session', r1.includes('1 use') && r1.includes('1 active session'), r1.replace(/\s+/g, ' ').slice(0, 160));
    ok('admin sees first use and last access', /First used \d/.test(r1) && /Last access \d/.test(r1));

    // ---------------------------------------------------------------- deactivate / reactivate
    await adminRowAction(`Amaka ${RUN}`, 'Deactivate');
    ok('deactivated code: access ends immediately', await deniedAt(g, '/private/collection'));
    await adminRowAction(`Amaka ${RUN}`, 'Activate');
    ok('reactivated code works again', await unlock(g, code));

    // ---------------------------------------------------------------- revoke
    await adminRowAction(`Amaka ${RUN}`, 'Revoke');
    ok('revoked: client is signed out immediately', await deniedAt(g, '/private/collection'));
    ok('revoked: private API refuses the old session', (await g.request.get(BASE + '/api/private/products')).status() === 401);
    ok('revoked code can no longer be used', !(await unlock(g, code)));
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    ok('admin shows it as Revoked', (await row(`Amaka ${RUN}`).textContent()).includes('Revoked'));

    // ---------------------------------------------------------------- regenerate
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    await row(`Amaka ${RUN}`).locator('button:has-text("Regenerate")').click();
    await a.locator('[data-testid=issued-code]').waitFor({ timeout: 15000 });
    const code2 = (await a.locator('[data-testid=issued-code]').textContent()).trim();
    await a.click('button:has-text("Done")');
    ok('regenerated code differs', code2 !== code && /^LLG-/.test(code2));
    ok('old code stays dead after regenerating', !(await unlock(g, code)));
    ok('regenerated code unlocks', await unlock(g, code2));

    // ---------------------------------------------------------------- expiry
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    await row(`Amaka ${RUN}`).locator('button[title="Change expiry"]').click();
    const yesterday = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    await row(`Amaka ${RUN}`).locator('input[name=d]').fill(yesterday);
    await row(`Amaka ${RUN}`).locator('button[aria-label="Save expiry"]').click();
    await a.waitForTimeout(1500);
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    ok('admin shows it as Expired', (await row(`Amaka ${RUN}`).textContent()).includes('Expired'));
    ok('expired: session ends', await deniedAt(g, '/private/collection'));
    ok('expired code is rejected', !(await unlock(g, code2)));
    await gCtx.close();

    // ---------------------------------------------------------------- single use
    const once = await issue({ name: `Single ${RUN}`, singleUse: true });
    const { ctx: c1, page: p1 } = await newGuest();
    const { ctx: c2, page: p2 } = await newGuest();
    ok('single-use code unlocks once', await unlock(p1, once));
    ok('single-use code fails on a second device', !(await unlock(p2, once)));
    await p1.goto(BASE + '/private/collection');
    ok('the first device keeps its session', new URL(p1.url()).pathname === '/private/collection');
    await a.goto(BASE + '/admin/private', { waitUntil: 'load' });
    ok('admin shows the single-use code as Used', (await row(`Single ${RUN}`).textContent()).includes('Used'));
    // leaving ends the session on this device
    await p1.click('button:has-text("Leave the private collection")');
    await p1.waitForURL((u) => new URL(u).pathname === '/');
    ok('leaving ends the session', await deniedAt(p1, '/private/collection'));
    await c1.close();
    await c2.close();
    await adminRowAction(`Single ${RUN}`, 'Revoke');

    // ---------------------------------------------------------------- rate limiting
    const { ctx: rCtx, page: r } = await newGuest();
    for (let i = 0; i < 8; i++) await unlock(r, `LLG-ZZZZ-ZZZZ-ZZ${String(i).padStart(2, '2')}`);
    const valid = await issue({ name: `Limit ${RUN}` });
    ok('after 8 failures even a valid code is held back', !(await unlock(r, valid)));
    ok('rate-limit message shown', (await r.textContent('#private-error')).includes('Too many attempts'));
    const { ctx: oCtx, page: o } = await newGuest();
    ok('other visitors are not affected', await unlock(o, valid));
    await rCtx.close();
    await oCtx.close();
    await adminRowAction(`Limit ${RUN}`, 'Revoke');

    // ---------------------------------------------------------------- admin preview
    await a.goto(BASE + '/private/collection', { waitUntil: 'load' });
    await a.locator('#private-title').waitFor({ timeout: 15000 }).catch(() => {});
    const preview = await a.locator('main').textContent().catch((e) => 'ERR ' + e.message);
    ok('signed-in admin can preview the collection', preview.includes(NAME), a.url() + ' ' + preview.slice(0, 120));
  } catch (e) {
    ok('test run finished without exceptions', false, e.message.split('\n')[0]);
  } finally {
    await setPrivate(false).catch((e) => console.log('cleanup failed: ' + e.message));
    const back = await a.request.get(BASE + `/product/${SLUG}`);
    ok('cleanup: piece is public again', back.status() === 200, String(back.status()));
  }
  ok('no page errors', errors.length === 0, errors.join(' | '));

  await b.close();
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
