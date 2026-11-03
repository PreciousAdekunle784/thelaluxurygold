const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3100';
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond, info }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

(async () => {
  const b = await chromium.launch();

  // ---------------------------------------------------------------- crawl
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200) + ' @ ' + (m.location()?.url ?? '')); });
    p.on('response', (r) => { if (r.status() === 404 && !r.url().includes('does-not-exist')) errors.push('404 ' + r.url()); });
    const sm = await (await fetch(BASE + '/sitemap.xml')).text();
    const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
    const extra = ['/cart', '/checkout', '/wishlist', '/account', '/shop?category=rings', '/does-not-exist'];
    const seenLinks = new Set();
    let badImages = 0, pagesOk = 0;
    for (const u of [...new Set([...urls.map((x) => x || '/'), ...extra])]) {
      const r = await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const status = r.status();
      if (u === '/does-not-exist') ok('404 page returns 404', status === 404);
      else if (status === 200) pagesOk++;
      else ok(`page ${u} status`, false, String(status));
      // scroll to trigger lazy images
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
      await p.waitForFunction(() => [...document.images].filter((i) => i.offsetParent !== null && i.getBoundingClientRect().width > 0).every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
      const imgs = await p.$$eval('img', (els) => els.filter((i) => i.offsetParent !== null && i.getBoundingClientRect().width > 0).map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })));
      const bad = imgs.filter((i) => !i.ok);
      if (bad.length) { badImages += bad.length; console.log('  bad images on', u, bad.slice(0, 3)); }
      (await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))).forEach((h) => seenLinks.add(h));
    }
    ok('all sitemap + app pages return 200', pagesOk === new Set([...urls.map((x) => x || '/'), ...extra]).size - 1, `${pagesOk} pages`);
    ok('no broken images', badImages === 0, `${badImages} broken`);
    // internal links
    const internal = [...seenLinks].filter((h) => h.startsWith('/') && !h.startsWith('//'));
    let brokenLinks = [];
    for (const h of internal) {
      const r = await fetch(BASE + h, { redirect: 'manual' });
      if (r.status >= 400) brokenLinks.push(`${h} ${r.status}`);
    }
    ok('no broken internal links', brokenLinks.length === 0, `${internal.length} checked ${brokenLinks.join(', ')}`);
    const wa = [...seenLinks].filter((h) => h.includes('wa.me'));
    ok('WhatsApp links use main number with prefilled text', wa.length > 0 && wa.every((h) => h.startsWith('https://wa.me/2348149734675')) && wa.some((h) => h.includes('?text=')), `${wa.length} links`);
    const ext = [...seenLinks].filter((h) => /^https?:/.test(h) && !h.includes('wa.me'));
    console.log('  external links:', [...new Set(ext)].join(' '));
    const realErrors = errors.filter((e) => !e.includes('does-not-exist'));
    ok('no page errors during crawl', realErrors.length === 0, realErrors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- shop filtering, sorting & search
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/shop', { waitUntil: 'networkidle' });
    const count = async () => p.locator('main ul.grid > li:visible').count();
    const total = await count();
    ok('shop lists all products', total === 19, `${total}`);
    await p.locator('aside label:has-text("Rings")').first().click();
    await p.waitForURL(/category=rings/);
    await p.waitForTimeout(700);
    ok('category filter (rings) → 4', (await count()) === 4, `${await count()}`);
    await p.locator('aside label:has-text("18K gold")').first().click();
    await p.waitForURL(/purity=18K/);
    await p.waitForTimeout(700);
    ok('purity filter (rings + 18K) → 2', (await count()) === 2, `${await count()}`);
    await p.goto(BASE + '/shop?purity=24K', { waitUntil: 'networkidle' });
    ok('purity 24K → 5 gold bars', (await count()) === 5, `${await count()}`);
    await p.goto(BASE + '/shop?max=2000', { waitUntil: 'networkidle' });
    const under = await p.$$eval('main ul.grid > li', (lis) => lis.map((li) => li.textContent));
    ok('price filter max 2000 → 4 items', under.length === 4, `${under.length}`);
    await p.goto(BASE + '/shop?sort=price-asc', { waitUntil: 'networkidle' });
    const prices = await p.$$eval('main ul.grid > li', (lis) => lis.map((li) => { const m = li.textContent.match(/AED ([\d,]+)/); return m ? Number(m[1].replace(/,/g, '')) : Infinity; }));
    ok('sort price low→high is ascending', prices.every((v, i) => i === 0 || v >= prices[i - 1]), prices.slice(0, 6).join(','));
    await p.goto(BASE + '/shop?stock=1', { waitUntil: 'networkidle' });
    ok('availability filter hides 3 made-to-order', (await count()) === 16, `${await count()}`);
    await p.goto(BASE + '/shop?purity=24K&category=rings', { waitUntil: 'networkidle' });
    ok('empty state shown for no results', await p.locator('text=No pieces match your selection').isVisible());
    await p.locator('button:has-text("Clear filters")').click();
    await p.waitForTimeout(800);
    ok('clear filters restores all', (await count()) === 19, `${await count()}`);
    // header search
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.locator('header button[aria-label="Search"]').last().click();
    await p.fill('#site-search', 'hoops');
    await p.waitForTimeout(400);
    ok('instant search shows Classic Gold Hoops', await p.locator('[role=dialog] >> text=Classic Gold Hoops').isVisible());
    await p.keyboard.press('Enter');
    await p.waitForURL(/\/shop\?q=hoops/);
    await p.waitForTimeout(700);
    ok('search results page filters by query', (await count()) === 2 && (await p.locator('main ul.grid > li:visible').first().textContent()).includes('Classic Gold Hoops'), `${await count()}`);
    await p.goto(BASE + '/shop?q=medaille', { waitUntil: 'networkidle' });
    ok('search is accent-insensitive (medaille → Médaille)', (await count()) === 1);
    // mega menu
    await p.goto(BASE + '/shop', { waitUntil: 'networkidle' });
    await p.locator('nav[aria-label=Main] a:has-text("Collections")').hover();
    await p.waitForTimeout(600);
    ok('collections mega menu opens on hover', await p.locator('text=Curated collections').isVisible());
    await ctx.close();
  }

  // ---------------------------------------------------------------- cart + wishlist + checkout
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/product/maison-signet-ring', { waitUntil: 'networkidle' });
    ok('PDP shows 3 gallery images', (await p.locator('main button[aria-label^="Enlarge image"]').count()) === 3);
    const ld = await p.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent)));
    ok('PDP has Product structured data with AED offer', ld.some((d) => d['@type'] === 'Product' && d.offers?.priceCurrency === 'AED'));
    await p.locator('main button:has-text("Add to bag")').click();
    ok('size required before adding', await p.locator('text=Please select a ring size.').isVisible());
    await p.locator('main button[aria-pressed]:has-text("54")').click();
    await p.locator('main button:has-text("Add to bag")').click();
    await p.waitForTimeout(500);
    const badge = await p.locator('header button[aria-label^="Shopping bag"]').getAttribute('aria-label');
    ok('cart count updates to 1', badge.includes('1 items'), badge);
    ok('add to bag opens cart drawer', await p.locator('[role=dialog][aria-label="Shopping bag"]').isVisible());
    await p.keyboard.press('Escape');
    await p.waitForTimeout(700);
    ok('Escape closes cart drawer', !(await p.locator('[role=dialog][aria-label="Shopping bag"]').isVisible()));
    await p.goto(BASE + '/product/classic-gold-hoops', { waitUntil: 'networkidle' });
    await p.locator('main button:has-text("Add to bag")').click();
    await p.waitForTimeout(400);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(700);
    // wishlist
    await p.locator('main button[aria-label^="Add Classic Gold Hoops to wishlist"]').first().click();
    await p.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    ok('cart persists across pages (2 lines)', (await p.locator('main li:has(a[href^="/product/"])').count()) === 2);
    const subtotal1 = await p.locator('aside dd').first().textContent();
    ok('subtotal = 3,400 + 1,950', subtotal1.includes('5,350'), subtotal1);
    await p.locator('main button[aria-label="Increase quantity"]').first().click();
    await p.waitForTimeout(300);
    const subtotal2 = await p.locator('aside dd').first().textContent();
    ok('quantity increase recalculates subtotal', subtotal2.includes('8,750'), subtotal2);
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const subtotal3 = await p.locator('aside dd').first().textContent();
    ok('cart persists after reload', subtotal3.includes('8,750'), subtotal3);
    await p.locator('main button:has-text("Remove")').last().click();
    await p.waitForTimeout(300);
    ok('remove line', (await p.locator('main li:has(a[href^="/product/"])').count()) === 1);
    await p.goto(BASE + '/wishlist', { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    ok('wishlist shows saved item', await p.locator('main >> text=Classic Gold Hoops').first().isVisible());
    // checkout
    await p.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
    await p.locator('button:has-text("Submit order request")').click();
    ok('checkout validates required fields', await p.locator('text=Enter a valid email address.').isVisible());
    await p.fill('input[name=email]', 'test@example.com');
    await p.fill('input[name=phone]', '+971 50 000 0000');
    await p.fill('input[name=firstName]', 'Test');
    await p.fill('input[name=lastName]', 'Customer');
    await p.fill('input[name=address1]', '1 Example Street');
    await p.fill('input[name=city]', 'Dubai');
    ok('UAE shows UAE shipping method', await p.locator('text=UAE insured delivery').isVisible());
    await p.selectOption('select[name=country]', 'GB');
    await p.waitForTimeout(200);
    ok('international country switches shipping method + customs note', (await p.locator('text=International insured express').isVisible()) && (await p.locator('text=import duties, taxes').isVisible()));
    ok('card payment disabled until gateway connected', await p.locator('input[name=paymentMethod]').first().isDisabled());
    const [resp] = await Promise.all([p.waitForResponse((r) => r.url().includes('/api/orders')), p.locator('button:has-text("Submit order request")').click()]);
    ok('order API returns 201', resp.status() === 201, String(resp.status()));
    await p.waitForTimeout(600);
    const ref = await p.locator('strong:has-text("LLG-")').textContent().catch(() => '');
    ok('confirmation shows reference & no-payment notice', /LLG-[A-Z0-9]{8}/.test(ref) && (await p.locator('text=No payment has been taken.').isVisible()), ref);
    const waHref = await p.locator('a:has-text("Confirm on WhatsApp")').getAttribute('href');
    ok('confirmation WhatsApp link includes reference', waHref.includes(encodeURIComponent(ref)));
    const after = await p.locator('header button[aria-label^="Shopping bag"]').getAttribute('aria-label');
    ok('cart cleared after order request', after.includes('0 items'), after);
    // API tampering: server recomputes and validates
    const bad = await p.request.post(BASE + '/api/orders', { data: { lines: [{ productId: 'nope', quantity: 1 }] } });
    ok('order API rejects invalid payload (422)', bad.status() === 422);
    // newsletter + contact
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    const nl = p.locator('section[aria-labelledby=newsletter]');
    await nl.scrollIntoViewIfNeeded();
    await nl.locator('input[type=email]').fill('hello@example.com');
    await nl.locator('button:has-text("Subscribe")').click();
    await p.waitForTimeout(300);
    ok('newsletter requires consent', await nl.locator('text=Please confirm').isVisible());
    await nl.locator('input[type=checkbox]').check();
    await nl.locator('button:has-text("Subscribe")').click();
    await p.waitForTimeout(800);
    ok('newsletter subscribe success', await nl.locator("text=you're on the list").isVisible());
    await p.goto(BASE + '/contact', { waitUntil: 'networkidle' });
    await p.fill('input[name=name]', 'Test');
    await p.fill('input[name=email]', 'test@example.com');
    await p.fill('textarea[name=message]', 'I would like to ask about ring sizes.');
    await p.locator('button:has-text("Send message")').click();
    await p.waitForTimeout(800);
    ok('contact form submits', await p.locator('text=our team will be in touch').isVisible());
    await ctx.close();
  }

  // ---------------------------------------------------------------- mobile
  {
    const ctx = await b.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok('mobile home has no horizontal overflow', overflow <= 0, `${overflow}px`);
    await p.locator('button[aria-label="Open menu"]').click();
    await p.waitForTimeout(700);
    ok('mobile menu opens', await p.locator('nav[aria-label=Mobile]').isVisible());
    await p.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Rings', exact: true }).click();
    await p.waitForURL(/collections\/rings/);
    await p.waitForTimeout(1000);
    ok('mobile menu navigates & closes', !(await p.locator('nav[aria-label=Mobile]').isVisible()));
    await p.goto(BASE + '/shop', { waitUntil: 'networkidle' });
    await p.locator('button:has-text("Filters")').click();
    await p.waitForTimeout(600);
    await p.locator('[role=dialog][aria-label=Filters] label:has-text("Earrings")').click();
    await p.waitForURL(/category=earrings/);
    await p.waitForTimeout(600);
    ok('mobile filter drawer filters (earrings → 3)', (await p.locator('main ul.grid > li:visible').count()) === 3);
    for (const u of ['/shop', '/product/medaille-coin-pendant', '/checkout', '/gold-bars', '/about', '/contact', '/collections']) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (o > 0) ok(`mobile ${u} no horizontal overflow`, false, `${o}px`);
    }
    ok('mobile pages checked for overflow', true);
    // quick add on mobile
    await p.goto(BASE + '/collections/earrings', { waitUntil: 'networkidle' });
    await p.locator('button:has-text("Quick add"):visible').first().click();
    await p.waitForTimeout(800);
    ok('mobile quick add opens cart drawer', await p.locator('[role=dialog][aria-label="Shopping bag"]').isVisible());
    await ctx.close();
  }

  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
