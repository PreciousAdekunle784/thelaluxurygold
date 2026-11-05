// End-to-end checks for online payment (Paystack) against the local mock (tests/mock-paystack.cjs).
//   node tests/mock-paystack.cjs &
//   PAYSTACK_SECRET_KEY=sk_test_mock npm run build
//   PAYSTACK_SECRET_KEY=sk_test_mock PAYSTACK_API_BASE=http://localhost:4010 npx next start -p 3100
//   BASE=http://localhost:3100 node tests/payments-e2e.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3100';
const MOCK = process.env.MOCK || 'http://localhost:4010';
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const RUN = Date.now().toString(36);

async function checkout(p, email) {
  await p.goto(BASE + '/product/maison-signet-ring', { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await p.locator('main button[aria-pressed]:has-text("54")').click();
  await p.locator('#add-to-bag').click();
  await p.waitForTimeout(400);
  await p.goto(BASE + '/checkout', { waitUntil: 'load' });
  await p.waitForTimeout(700);
  await p.fill('input[name=email]', email);
  await p.fill('input[name=phone]', '+234 801 000 0000');
  await p.fill('input[name=firstName]', 'Pay');
  await p.fill('input[name=lastName]', 'Tester');
  await p.fill('input[name=address1]', '1 Admiralty Way');
  await p.fill('input[name=city]', 'Lagos');
  await p.selectOption('select[name=country]', 'NG');
  await p.waitForTimeout(200);
}

const lookup = async (p, ref, email) => (await (await p.request.post(BASE + '/api/orders/lookup', { data: { reference: ref, email } })).json());

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));

  // 1. successful payment
  const e1 = `pay1+${RUN}@example.com`;
  await checkout(p, e1);
  ok('Paystack option is offered and selected by default', await p.locator('input[name=paymentMethod][value=paystack]').isChecked());
  const quoted = (await p.locator('label:has(input[value=paystack])').textContent()).match(/₦[\d,]+/)?.[0];
  ok('checkout shows the naira amount to be charged', !!quoted, quoted);
  await Promise.all([p.waitForURL(/localhost:4010\/pay\//), p.click('button:has-text("Continue to secure payment")')]);
  const charged = await p.locator('#amount').textContent();
  ok('redirected to Paystack checkout with the same amount', quoted && charged === `NGN ${quoted.replace(/[₦,]/g, '')}`, `${charged} vs ${quoted}`);
  ok('Paystack receives the customer email', (await p.locator('#email').textContent()) === e1);
  await Promise.all([p.waitForURL(/\/checkout\/complete/), p.click('#pay')]);
  await p.waitForSelector('text=Payment received');
  const ref1 = (await p.locator('main strong:has-text("LLG-")').first().textContent()).trim();
  ok('return page confirms payment', /^LLG-/.test(ref1), ref1);
  ok('order is marked paid after verification', (await lookup(p, ref1, e1)).status === 'paid');
  await p.reload({ waitUntil: 'load' });
  ok('revisiting the return page is idempotent', (await p.locator('text=Payment received').count()) === 1 && (await lookup(p, ref1, e1)).history.filter((h) => h.status === 'paid').length === 1);

  // 2. cancelled, then retried
  const e2 = `pay2+${RUN}@example.com`;
  await checkout(p, e2);
  await Promise.all([p.waitForURL(/localhost:4010\/pay\//), p.click('button:has-text("Continue to secure payment")')]);
  await Promise.all([p.waitForURL(/\/checkout\/complete/), p.click('#cancel')]);
  await p.waitForSelector('text=Payment not completed');
  const ref2 = (await p.locator('main strong:has-text("LLG-")').first().textContent()).trim();
  ok('cancelled payment leaves the order awaiting payment', (await lookup(p, ref2, e2)).status === 'awaiting_payment');
  await Promise.all([p.waitForURL(/localhost:4010\/pay\//), p.click('button:has-text("Pay now with Paystack")')]);
  await Promise.all([p.waitForURL(/\/checkout\/complete/), p.click('#pay')]);
  await p.waitForSelector('text=Payment received');
  ok('retrying payment completes the order', (await lookup(p, ref2, e2)).status === 'paid');

  // 3. webhook settles a payment the shopper never returned from
  const e3 = `pay3+${RUN}@example.com`;
  await checkout(p, e3);
  await Promise.all([p.waitForURL(/localhost:4010\/pay\//), p.click('button:has-text("Continue to secure payment")')]);
  const psRef = decodeURIComponent(p.url().split('/pay/')[1]);
  const ref3 = psRef.slice(0, 12);
  const bad = await (await p.request.post(`${MOCK}/webhook/${psRef}?site=${encodeURIComponent(BASE)}&badsig=1`)).json();
  ok('webhook with a bad signature is rejected', bad.delivered === 401, String(bad.delivered));
  ok('…and the order is still unpaid', (await lookup(p, ref3, e3)).status === 'awaiting_payment');
  const good = await (await p.request.post(`${MOCK}/webhook/${psRef}?site=${encodeURIComponent(BASE)}`)).json();
  ok('signed webhook is accepted', good.delivered === 200, String(good.delivered));
  ok('webhook marks the order paid', (await lookup(p, ref3, e3)).status === 'paid');

  // 4. a charge for less than requested is never accepted
  const e4 = `pay4+${RUN}@example.com`;
  await checkout(p, e4);
  await Promise.all([p.waitForURL(/localhost:4010\/pay\//), p.click('button:has-text("Continue to secure payment")')]);
  await Promise.all([p.waitForURL(/\/checkout\/complete/), p.click('#tamper')]);
  await p.waitForTimeout(800);
  const ref4 = (await p.locator('main strong:has-text("LLG-")').first().textContent()).trim();
  ok('underpaid charge is not marked paid', (await lookup(p, ref4, e4)).status === 'awaiting_payment' && (await p.locator('text=Payment received').count()) === 0);

  // 5. order-request path still works
  await checkout(p, `req+${RUN}@example.com`);
  await p.locator('label:has(input[value=order-request])').click();
  await p.click('button:has-text("Submit order request")');
  await p.waitForSelector('text=Order request received');
  ok('“Confirm & pay with our team” still places an order request', true);

  // 6. API refuses online payment for price-on-request pieces
  const por = await p.request.post(BASE + '/api/orders', {
    data: {
      customer: { email: 'por@example.com', phone: '+234 801 000 0000', firstName: 'A', lastName: 'B' },
      shipping: { address1: 'x', city: 'Lagos', country: 'NG' },
      shippingMethodId: 'international-express', paymentMethod: 'paystack', currency: 'NGN',
      lines: [{ productId: 'p-bar-cast-100g', quantity: 1 }],
    },
  });
  ok('price-on-request items cannot be paid online (422)', por.status() === 422, String(por.status()));

  ok('no client errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} payment checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
