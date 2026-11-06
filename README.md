# LA Luxury Gold: e-commerce website

A luxury e-commerce storefront for **LA Luxury Gold**, a Dubai jewellery house offering 18K–24K gold jewellery and 24K gold bars with worldwide delivery.

Built with **Next.js 16** (App Router, Cache Components), **React 19**, **TypeScript**, **Tailwind CSS 4**, **Framer Motion** and **Lucide**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
```

## Design system

| Token | Value | Use |
| --- | --- | --- |
| `obsidian` | `#11100F` | Hero, "The gold experience", footer, text and primary buttons (`ink`) |
| `burgundy` / `burgundy-deep` | `#4A1025` / `#2C0915` | Campaign interlude, announcement bar, Our Story, button hover |
| `emerald` / `emerald-deep` | `#174C3A` / `#0E3326` | Gold-bars sections, WhatsApp button, testimonials |
| `champagne` / `gold` / `gold-pale` | `#C6A46A` / `#D6BA84` / `#EAD9B6` | Eyebrows, hairlines, primary hero button, accents (used sparingly) |
| `ivory` / `linen` / `sand` / white | `#F7F3EC` / `#F2ECE2` / `#EEE6D9` / `#FFFFFF` | Editorial light sections and product-image backgrounds |

The homepage is image-first: hero slideshow → auto-scrolling **New Arrivals** → photographic collection mosaic → full-width
campaign band (necklaces) → featured pieces → campaign band (earrings) → **The Gift Edit** on sage → full-bleed **24K gold bars**
with weight shortcuts → slim service strip → (testimonials) → **@laluxurygold** gallery → newsletter. Copy is kept to short headlines
and clear actions (Shop now, Explore collection, View product, Discover gold bars). Campaign photos drift gently on scroll through
CSS scroll-driven animation, which is off for reduced-motion visitors.

* **Type**: Cormorant Garamond for display headlines (uppercase); **Corinthia Bold**, a bold calligraphic script, for the accent word in each headline ("*beyond*", "*presence*", "*cherished*") via the `script` utility class; Manrope for navigation, UI and body text. Small uppercase "eyebrows" use 0.28em tracking.
* **Logo**: a typographic wordmark ("LA LUXURY GOLD" with a "Dubai" line) and an **LG monogram set inside an arch**, a nod to Dubai architecture. It works on light and dark backgrounds: `src/components/brand/Logo.tsx`, plus `src/app/icon.png` and `apple-icon.png`.
* **Components**: square-edged buttons, hairline dividers, arch-masked imagery used once, and restrained motion (fade-up reveals, slow image scale, mask-reveal hero type). Motion respects `prefers-reduced-motion`.

## Project structure

```
src/app/(store)/         Storefront routes: home, shop, collections/[slug], gold-bars, product/[slug],
                         cart, checkout, wishlist, account, about, contact, faq, shipping,
                         returns, privacy, terms, api/{orders,newsletter,contact}, sitemap, robots
src/components/          brand · layout · home · shop · product · cart · forms · ui
src/lib/config/store.ts  Business settings: contact numbers, socials, currencies, shipping, payment options
src/lib/data/            Starting catalogue (products.ts), categories & collections, site settings, media registry
src/lib/data/catalogue.ts   Data-access layer (search, filter, sort). Swap the data source here.
src/lib/state/           Cart, wishlist and currency providers (persisted to localStorage)
src/lib/server/          Order validation & persistence, webhook forwarding
src/lib/db, src/lib/repo Database client (Postgres / SQLite), schema & data access
src/lib/auth/            Admin session signing & guards
src/app/admin/           Admin panel (dashboard, visitors, orders, buyers, products…)
src/proxy.ts             Protects /admin and /api/admin
src/lib/payments/        Payment-gateway interface (no provider connected)
tools/studio/            Blender Cycles scenes that render the image library (see docs/IMAGE-ASSETS.md)
docs/IMAGE-ASSETS.md     Every image: what it shows, where it is used, what to replace before launch
tests/e2e.cjs            Playwright end-to-end checks (run against `npm start`)
```

## Content you manage

* **Products and prices** live in the database and are edited in `/admin → Products`. `src/lib/data/products.ts` is only the starting catalogue copied in on first run. Prices are in **US dollars**.
* **Currency.** Prices are set in USD. Shoppers can switch to **Nigerian naira** (header, menu and footer). Visitors in Nigeria see naira first. The naira rate is set in `/admin → Store settings`, and naira prices are rounded to the nearest ₦100. Orders are stored in USD, and the order page also shows the naira amount the shopper saw.
* **Testimonials** are added in `/admin → Testimonials`. The homepage section only appears once at least one is published. Only publish feedback a client actually gave, credited the way they agreed.
* **Policies.** LA Luxury Gold does **not** offer a standard return period. The returns page, terms, FAQ and product pages say so, and ask customers to contact the team about a specific piece before ordering. No refund timelines, delivery times, insurance, tracking or packaging are promised anywhere. Delivery charges and timelines are confirmed with each order. If the business adopts a formal policy later, add it to `src/app/(store)/returns/page.tsx` and `shipping/page.tsx`. Change the "Last updated" date in `src/components/shop/LegalPage.tsx` whenever you edit a policy.

### Imagery

Every image in `public/images/laluxurygold/` is an **original physically based 3D render** made with Blender Cycles (`tools/studio/`).
The library covers campaign images, six category images, macro details, packaging and three shots of every product. The homepage hero is a five-image crossfading slideshow (every 6 s), with a separately composed portrait image for phones behind centred type. A photo uploaded in Admin → Store settings becomes the first slide.
There is no stock photography and no AI generation. These are renders, not photographs of the specific items, so
starting products show a short "studio renderings" note on their page until real photos are uploaded (untick
**Images are studio renders** in Admin → Products).

The brief's signature **model** campaign could not be produced here. There was no image-generation tool, and
licensed photo libraries were blocked by the network. The hero therefore uses a velvet display bust. Upload a real
campaign photo in **Admin → Store settings** whenever one is available. Full details, the asset list and the
replace-before-launch checklist are in **[docs/IMAGE-ASSETS.md](docs/IMAGE-ASSETS.md)**.

To replace an image, drop a new file at the same key under `public/images/laluxurygold/` (products 4:5), then run:

```bash
npm run media                       # rebuild sizes + blur placeholders
npm run media -- --import ./photos  # or convert a folder of JPG/PNG to WebP first
```

### Navigation & listings

Shop (mega menu) · New Arrivals (`/new-arrivals`, pieces flagged "new") · Collections (mega menu) · Fine Jewellery
(`/fine-jewellery`, every category except bars) · Gold Bars · Our Story. Categories are rings, necklaces, bracelets,
earrings, **jewellery sets** and gold bars. Listings filter by category, purity, **size** (ring size, chain length
and bracelet size from the catalogue), price and availability. They sort five ways and load 12 pieces at a time,
loading more as you scroll. Product pages have a zoomable full-screen gallery (click or tap to magnify 2.4×), a
sticky purchase panel on desktop and a buy bar on phones.

## Configuration

Copy `.env.example` to `.env.local` and fill it in.

| Env var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin` (admin is disabled until set) |
| `ADMIN_SESSION_SECRET` | Optional secret for signing admin sessions |
| `DATABASE_URL` | PostgreSQL connection string (required on serverless hosts); omit for local SQLite |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and structured data |
| `NEXT_PUBLIC_NGN_PER_USD` | Optional: naira rate used until one is saved in Store settings (default 1550) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional public email |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_live_…`), server only. Enables "Pay now" at checkout |
| `ORDER_WEBHOOK_URL` | Optional: also forward each order as JSON (CRM, email automation, Make/Zapier, Sheets…) |
| `NEWSLETTER_WEBHOOK_URL` | Receives newsletter sign-ups |
| `CONTACT_WEBHOOK_URL` | Receives contact-form messages |

Orders, messages and sign-ups are always saved to the database and shown in the admin. Webhooks are optional extras.

* **Currency**: USD (base) and NGN, defined in `store.ts`. The naira rate comes from `/admin → Store settings`.
* **Shipping**: methods are defined in `store.ts`. Rates are `null`, shown as "Confirmed with your order", until you set a flat rate.
* **WhatsApp**: the main number `08149734675` is used in international format (`+234 814 973 4675`, assumed Nigerian). UAE `+971 50 625 9597` and secondary `+234 814 966 6013` are listed on the contact page and in the footer. Change these in `store.contact`.

## Admin panel (`/admin`)

A private dashboard for running the store. Sign in at **`/admin`** with the password set in `ADMIN_PASSWORD`. The admin is disabled until that variable is set.

| Section | What it shows / does |
| --- | --- |
| **Dashboard** | Visitors on the site right now (updates every ~8 s), visitors and page views today and this week, revenue received, value of all orders, buyers and average paid order. Also: 14-day charts, a live activity stream, latest orders, and top pages, referrers, countries and devices. |
| **Visitors** | Today / 7 / 30-day traffic and a full visit log: time, page, anonymous visitor ID, new or returning, country, device, browser and source. |
| **Orders** | Every order with status tabs, search and CSV export. On the order page you see the items, totals, buyer contact (email, call, WhatsApp), delivery address and notes, and you can update the status with a note. |
| **Buyers** | Everyone who has ordered, with order count, total ordered, total paid and last order. CSV export. |
| **Products** | Create, edit, hide/show and delete products. You can edit the name, web address, category, purity, weight, price (or "price on request"), availability, description, specifications, options with per-option price differences, collections and labels. You can also upload images or pick existing ones and reorder them. Changes go live on the store immediately. |
| **Testimonials** | Add, edit, hide or delete client testimonials. The homepage section is hidden until one is published. |
| **Store settings** | The naira-per-dollar exchange rate, and the homepage hero. By default the hero shows the campaign image; upload a photo (desktop, and optionally a portrait version for phones) to show it instead, or switch back at any time. |
| **Messages** / **Subscribers** | Contact-form messages (mark read, reply by email or WhatsApp) and newsletter sign-ups (CSV export). |

**New-order alerts.** When a customer places an order, every open admin page shows a pop-up and plays a soft chime. Click **Enable order alerts** in the sidebar to also get desktop notifications.

**Money.** No payment gateway is connected, so orders arrive as "Awaiting confirmation". "Revenue received" counts only orders you mark **Paid**, **Shipped** or **Delivered**. "Value of all orders" counts everything except cancelled orders.

**Visitor tracking** is first-party and anonymous: a random ID in the visitor's browser, with no IP addresses, cookies or third-party scripts. Bots and your own visits while signed in are ignored. Country appears when your host sends a location header (Vercel and Cloudflare do).

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor → New query**, paste **`supabase/schema.sql`** and click **Run**. It creates every table and enables Row Level Security, so Supabase's public API keys cannot read your orders or customers. It is safe to run again.
3. In **Project Settings → Database → Connection string**, copy the **Transaction pooler** URI (port `6543`) and replace `[YOUR-PASSWORD]`.
4. Set it as **`DATABASE_URL`** in your hosting environment (Vercel: *Settings → Environment Variables*), together with `ADMIN_PASSWORD`, then redeploy.
5. On first start the site copies the starting catalogue into `products`. Manage everything from `/admin` after that. The optional `product_overview` and `order_overview` views make the data easy to browse in Supabase's Table Editor.

The **project URL** (`https://<ref>.supabase.co`) is *not* the connection string. `DATABASE_URL` must look like:

```
postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The admin shows a **Database connected** line at the top of every page, or a clear error if the connection fails, for example a wrong password or the project URL pasted by mistake. **Vercel region.** `vercel.json` runs the site's server functions in Dublin (`dub1`), next to a Supabase project in `eu-west-1`, so each database query is a short hop instead of a transatlantic round trip. If your Supabase project is in another region, change it to the nearest Vercel region.

The app connects server-side with SSL, using a driver configured for the pooler (no prepared statements). Uploaded images are stored in the `media` table. Payments are not connected yet.

### Data storage

| Setting | Storage |
| --- | --- |
| `DATABASE_URL` set | **PostgreSQL** (Neon, Supabase, Railway, RDS…). **Required on Vercel and other serverless hosts.** |
| not set | A local **SQLite** file at `.data/llg.sqlite`, built into Node 22.13+. Fine for development or a single server; back the file up. |

The tables are created automatically, and the starting catalogue is copied into the database on first run. From then on, products are managed in the admin, and `src/lib/data/products.ts` is only the initial seed. Uploaded images are stored in the database and served from `/media/<id>`.

**Security.** Admin pages and APIs are protected twice: by `src/proxy.ts`, and again inside every page and action. Sessions are signed, HTTP-only cookies lasting 12 hours. Login attempts are rate-limited. Use a long, unique `ADMIN_PASSWORD`. Optionally set `ADMIN_SESSION_SECRET`; changing it signs every session out.

## Checkout & payments

Checkout collects contact details, a delivery address with country selection, a shipping method and a payment option. Prices are
re-validated and recalculated on the server. **No payment is ever simulated.**

* **Pay now (Paystack).** Shown only when `PAYSTACK_SECRET_KEY` is set. The order is saved as **Awaiting payment** and a Paystack
  transaction is initialised on the server. The shopper is redirected to Paystack's hosted checkout (card, bank transfer, USSD…) and
  returns to `/checkout/complete`. The order is marked **Paid** only after the server verifies the transaction with Paystack, and only if
  the amount, currency and reference match what was requested. The signed webhook `/api/payments/paystack/webhook` settles payments
  even if the shopper never returns. Abandoned payments can be retried from the completion page. Shoppers pay **in the currency they are
  shopping in**. Dollar shoppers are charged in US dollars without conversion. Naira shoppers are charged in naira, converted at the Store
  settings rate exactly as displayed. US dollar payments must be enabled on the Paystack account. Until they are, Paystack refuses dollar
  transactions and the shopper is offered "Pay in naira" or "Pay with our team" instead. Pieces priced on request can't be paid online.
* **Confirm & pay with our team.** Submits an order request (`LLG-1A2B3C4D`). The team confirms the order and arranges payment
  directly with the customer.

### Setting up Paystack

1. In the Paystack Dashboard → Settings → API Keys & Webhooks, copy the **secret key** (`sk_live_…`). Never put it in code or share it in chat.
2. In Vercel → Project → Settings → Environment Variables, add `PAYSTACK_SECRET_KEY` (Production), and optionally
   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (`pk_live_…`, not required by the hosted checkout). Then redeploy.
3. In the same Paystack page, set the **Webhook URL** to `https://<your-domain>/api/payments/paystack/webhook`.
4. To accept **US dollar** payments, ask Paystack to enable USD on your account (this needs a USD settlement account).
5. Make one small live payment in each currency, and check that the orders show as **Paid** with their Paystack references in `/admin/orders`.

**Order tracking.** `/account` lets customers look up an order with its reference and email. They see its status, a progress timeline and the items. The lookup is rate-limited, and internal status notes are never shown.

## Performance

The site is tuned for slow mobile connections. On a simulated 1.6 Mbps / 300 ms network with a 4× slower CPU, the main content appears in about **1.5–1.7 s** on every storefront page. Admin page changes show a placeholder within about **0.1 s**, and the content arrives in under a second. How:

* Storefront pages are prerendered and served from the CDN.
* The shop and collection grids arrive as ready-made HTML, so products appear before JavaScript loads.
* Hero and scroll animations are pure CSS. The headline animates in on first paint, and the animation library loads in the background (`LazyMotion`).
* Fonts are trimmed to the weights in use (Cormorant 400/500, Corinthia 700, Manrope).
* Images are served as AVIF/WebP at the right size, with blur placeholders. Product hover photos load only on hover. Images are cached between visits.
* The hero is a single responsive image (separately composed for desktop and phones), fetched with high priority.
* Admin data is fetched in parallel. The connection check is reused for 30 s, and order counts come from one grouped query.
* Server functions run next to the database (`vercel.json` → `dub1`).

## Testing

```bash
npm run build && npm start   # port 3000; or: npx next start -p 3100
BASE=http://localhost:3000 node tests/e2e.cjs                               # storefront
BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/admin-e2e.cjs      # admin
```

Both suites require Playwright with Chromium. The admin suite creates and deletes a test product and places test orders, so run it against a development database, not production.

The storefront suite covers:

* **Crawl**: every page in the sitemap and app returns 200, with no broken images, no SVGs standing in for photographs, and no broken internal links or console errors.
* **Shop**: filters (including size), sorting, progressive loading, empty state, the curated listings, navigation, the hero photograph, instant search and accent-insensitive search.
* **Cart and checkout**: variant validation, cart drawer, quantity and subtotal updates, persistence across reloads, wishlist, checkout validation, country-dependent shipping, order submission, and API validation.
* **Forms**: newsletter consent and contact form.
* **Mobile**: menu, filter drawer and quick add, plus horizontal-overflow checks on key pages.

## Launch checklist

- [ ] Replace the product renders with photographs of the real pieces and untick "Images are studio renders" (see docs/IMAGE-ASSETS.md)
- [ ] Optional: upload a real model campaign photo as the homepage hero (Admin → Store settings)
- [ ] Review product names, weights, sizes and prices in the admin
- [ ] Set the naira exchange rate in Store settings
- [ ] Confirm the WhatsApp/phone country codes and add a contact email
- [ ] Confirm shipping rates and timelines and the policy texts (legal review)
- [ ] Set `ADMIN_PASSWORD` and a production `DATABASE_URL` (PostgreSQL)
- [ ] Set `PAYSTACK_SECRET_KEY` in Vercel, add the webhook URL in Paystack, and make one small live test payment
- [ ] Add real client testimonials (with permission) in the admin
- [ ] Set `NEXT_PUBLIC_SITE_URL` and add analytics/cookie consent if required
