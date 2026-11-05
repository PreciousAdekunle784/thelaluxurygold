// A minimal local stand-in for the Paystack API and hosted checkout, for end-to-end tests only.
//   node tests/mock-paystack.cjs            (listens on PORT, default 4010)
// Run the site with PAYSTACK_SECRET_KEY=sk_test_mock PAYSTACK_API_BASE=http://localhost:4010
const http = require('http');
const crypto = require('crypto');
const PORT = Number(process.env.PORT || 4010);
const SECRET = 'sk_test_mock';
const tx = new Map();

const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const auth = req.headers.authorization === `Bearer ${SECRET}`;
    if (req.method === 'POST' && url.pathname === '/transaction/initialize') {
      if (!auth) return json(res, 401, { status: false, message: 'Invalid key' });
      const b = JSON.parse(body);
      tx.set(b.reference, { ...b, status: 'ongoing' });
      return json(res, 200, { status: true, message: 'Authorization URL created', data: { authorization_url: `http://localhost:${PORT}/pay/${b.reference}`, access_code: 'x', reference: b.reference } });
    }
    let m;
    if (req.method === 'GET' && (m = /^\/transaction\/verify\/(.+)$/.exec(url.pathname))) {
      if (!auth) return json(res, 401, { status: false, message: 'Invalid key' });
      const t = tx.get(decodeURIComponent(m[1]));
      if (!t) return json(res, 404, { status: false, message: 'Transaction reference not found' });
      return json(res, 200, { status: true, data: { status: t.status, reference: t.reference, amount: t.paidAmount ?? t.amount, currency: t.currency, channel: 'card', paid_at: t.status === 'success' ? new Date().toISOString() : null, metadata: t.metadata } });
    }
    // hosted checkout page
    if (req.method === 'GET' && (m = /^\/pay\/(.+)$/.exec(url.pathname))) {
      const t = tx.get(decodeURIComponent(m[1]));
      if (!t) { res.writeHead(404); return res.end('unknown'); }
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(`<!doctype html><title>Mock Paystack</title><h1>Mock Paystack</h1><p id="amount">${t.currency} ${t.amount / 100}</p><p id="email">${t.email}</p>
        <a id="pay" href="/act/${t.reference}?do=pay">Pay</a> <a id="cancel" href="/act/${t.reference}?do=cancel">Cancel</a> <a id="tamper" href="/act/${t.reference}?do=tamper">Pay less</a>`);
    }
    if (req.method === 'GET' && (m = /^\/act\/(.+)$/.exec(url.pathname))) {
      const t = tx.get(decodeURIComponent(m[1]));
      const d = url.searchParams.get('do');
      if (d === 'pay') t.status = 'success';
      if (d === 'cancel') t.status = 'abandoned';
      if (d === 'tamper') { t.status = 'success'; t.paidAmount = t.amount - 100; }
      res.writeHead(302, { location: `${t.callback_url}?trxref=${t.reference}&reference=${t.reference}` });
      return res.end();
    }
    // test helper: mark paid without redirecting, then deliver a signed webhook to the site
    if (req.method === 'POST' && (m = /^\/webhook\/(.+)$/.exec(url.pathname))) {
      const t = tx.get(decodeURIComponent(m[1]));
      t.status = 'success';
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: t.reference, amount: t.amount, currency: t.currency, status: 'success' } });
      const sig = crypto.createHmac('sha512', url.searchParams.get('badsig') ? 'wrong' : SECRET).update(payload).digest('hex');
      fetch(`${url.searchParams.get('site')}/api/payments/paystack/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-paystack-signature': sig }, body: payload })
        .then((r) => json(res, 200, { delivered: r.status }))
        .catch((e) => json(res, 500, { error: String(e) }));
      return;
    }
    json(res, 404, { status: false, message: 'not found' });
  });
}).listen(PORT, () => console.log(`mock paystack on ${PORT}`));
