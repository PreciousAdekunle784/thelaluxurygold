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
| `forest` | `#26382F` | Primary dark: footer, hero, announcement |
| `sage` / `sage-mist` | `#879681` / `#DFE3D8` | Secondary surfaces, testimonials |
| `champagne` / `gold` | `#C6A15B` / `#D4AF69` | Hairlines, eyebrows, monogram, accents (used sparingly) |
| `burgundy` | `#4B1726` | Campaign, brand story, alerts |
| `ink` | `#111111` | Text, primary buttons |
| `ivory` / `linen` / `sand` | `#F7F4ED` / `#F1ECE3` / `#EDE7DC` | Page, section and product-image backgrounds |

* **Type**: Cormorant Garamond for display headlines (uppercase); **Corinthia Bold**, a bold calligraphic script, for the accent word in each headline ("*timeless*", "*a legacy*", "*cherished*") via the `script` utility class; Manrope for UI and body text. Small uppercase "eyebrows" use 0.28em tracking.
* **Logo**: a typographic wordmark ("LA LUXURY GOLD" with a "Dubai" line) and an **LG monogram set inside an arch**, a nod to Dubai architecture. It works on light and dark backgrounds: `src/components/brand/Logo.tsx`, plus `src/app/icon.png` and `apple-icon.png`.
* **Components**: square-edged buttons, hairline dividers, arch-masked imagery used once, and restrained motion (fade-up reveals, slow image scale, mask-reveal hero type). Motion respects `prefers-reduced-motion`.

## Project structure

```
src/app/(store)/         Storefront routes: home, shop, collections/[slug], gold-bars, product/[slug],
                         cart, checkout, wishlist, account, about, contact, faq, shipping,
                         returns, privacy, terms, api/{orders,newsletter,contact}, sitemap, robots
src/components/          brand · layout · home · shop · product · cart · forms · ui
src/lib/config/store.ts  Business settings: contact numbers, socials, currencies, shipping, payment options
src/lib/data/            Catalogue (products.ts), categories & collections, testimonials, media registry
src/lib/data/catalogue.ts   Data-access layer (search, filter, sort). Swap the data source here.
src/lib/state/           Cart, wishlist and currency providers (persisted to localStorage)
src/lib/server/          Order validation & persistence, webhook forwarding
src/lib/db, src/lib/repo Database client (Postgres / SQLite), schema & data access
src/lib/auth/            Admin session signing & guards
src/app/admin/           Admin panel (dashboard, visitors, orders, buyers, products…)
src/proxy.ts             Protects /admin and /api/admin
src/lib/payments/        Payment-gateway interface (no provider connected)
tools/render/            The 3D studio renderer used to create the placeholder imagery
tests/e2e.cjs            Playwright end-to-end checks (run against `npm start`)
```

## Important: sample content

Real product data was not supplied, so the catalogue is a **clearly labelled sample**:

* Every product has `isSample: true` and shows a "Sample" / "Sample price" label. Names, weights, specifications and prices are placeholders.
* Testimonials are anonymous placeholders, labelled "Sample testimonial".
* While `NEXT_PUBLIC_SAMPLE_CATALOGUE` is not `"false"`, every page is `noindex` and `robots.txt` disallows crawling, so sample prices are never indexed.
* Policy pages (shipping, returns, privacy, terms) are **drafts**. Bracketed items must be confirmed by the business and reviewed legally.

### Hero film

The homepage hero plays a **seamless 12-second loop**: a slow camera drift around the gold still life, with reflections gliding across the gold and the dome ring turning on its plinth. It was rendered with the same 3D studio as the stills (`tools/render`). There is a 16:9 version for desktop and a 9:16 version for phones (`public/videos/hero-desktop|hero-mobile.mp4/.webm`).

* The first frame is served as an instant-loading poster, and the video fades in only once it is playing.
* It is muted and plays inline, so phones autoplay it.
* It pauses when off-screen or in a background tab.
* It is replaced by the still for visitors who prefer reduced motion or have data saver enabled.

To re-render it:

```bash
cd tools/render && npm i && node film-run.cjs hero-desktop film/d 0.8334 && node film-run.cjs hero-mobile film/m 0.8334
cd ../.. && tools/render/encode-film.sh tools/render/film/d hero-desktop && tools/render/encode-film.sh tools/render/film/m hero-mobile
```

To use your own footage, replace the four files in `public/videos/` (keep the names) and the two posters `public/images/editorial/hero-loop*.webp`, then run `npm run media`.

### Imagery

All photography is **placeholder still-life imagery rendered in a 3D studio** (`tools/render`): gold rings, chains, bangles, earrings and bars on travertine, silk and seamless backdrops. It contains no third-party stock or brand assets. Each product has three images: a studio shot, a styled shot (used for the hover swap) and a detail close-up.

To replace an image, drop a new file at the same key under `public/images/` (keep the aspect ratio: products 4:5), then run:

```bash
npm run media                       # rebuild sizes + blur placeholders
npm run media -- --import ./photos  # or convert a folder of JPG/PNG to WebP first
```

Products reference images by key (e.g. `products/aurelia-band-1`) in `src/lib/data/products.ts`.

## Configuration

Copy `.env.example` to `.env.local` and fill it in.

| Env var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin` (admin is disabled until set) |
| `ADMIN_SESSION_SECRET` | Optional secret for signing admin sessions |
| `DATABASE_URL` | PostgreSQL connection string (required on serverless hosts); omit for local SQLite |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and structured data |
| `NEXT_PUBLIC_SAMPLE_CATALOGUE` | Set to `false` once verified products are loaded (enables indexing, removes labels) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional public email |
| `ORDER_WEBHOOK_URL` | Optional: also forward each order as JSON (CRM, email automation, Make/Zapier, Sheets…) |
| `NEWSLETTER_WEBHOOK_URL` | Receives newsletter sign-ups |
| `CONTACT_WEBHOOK_URL` | Receives contact-form messages |

Orders, messages and sign-ups are always saved to the database and shown in the admin. Webhooks are optional extras.

* **Currency**: AED is the base currency. USD, EUR, GBP and SAR are defined in `store.ts` with `rate: null`. Give one a rate (ideally from a rates service) and it appears automatically in the currency layer.
* **Shipping**: methods are defined in `store.ts`. Rates and delivery estimates are `null` (shown as "confirmed by our team") until you set them. No rates or timelines were invented.
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
| **Homepage hero** | By default the hero plays the looping brand film. Upload a photo (desktop, and optionally a portrait version for phones) to show it instead, or switch back to the film at any time. |
| **Messages** / **Subscribers** | Contact-form messages (mark read, reply by email or WhatsApp) and newsletter sign-ups (CSV export). |

**New-order alerts.** When a customer places an order, every open admin page shows a pop-up and plays a soft chime. Click **Enable order alerts** in the sidebar to also get desktop notifications.

**Money.** No payment gateway is connected, so orders arrive as "Awaiting confirmation". "Revenue received" counts only orders you mark **Paid**, **Shipped** or **Delivered**. "Value of all orders" counts everything except cancelled orders.

**Visitor tracking** is first-party and anonymous: a random ID in the visitor's browser, with no IP addresses, cookies or third-party scripts. Bots and your own visits while signed in are ignored. Country appears when your host sends a location header (Vercel and Cloudflare do).

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor → New query**, paste **`supabase/schema.sql`** and click **Run**. It creates every table and enables Row Level Security, so Supabase's public API keys cannot read your orders or customers. It is safe to run again.
3. In **Project Settings → Database → Connection string**, copy the **Transaction pooler** URI (port `6543`) and replace `[YOUR-PASSWORD]`.
4. Set it as **`DATABASE_URL`** in your hosting environment (Vercel: *Settings → Environment Variables*), together with `ADMIN_PASSWORD`, then redeploy.
5. On first start the site copies the sample catalogue into `products`. Manage everything from `/admin` after that. The optional `product_overview` and `order_overview` views make the data easy to browse in Supabase's Table Editor.

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

The tables are created automatically, and the sample catalogue is copied into the database on first run. From then on, products are managed in the admin, and `src/lib/data/products.ts` is only the initial seed. Uploaded images are stored in the database and served from `/media/<id>`.

**Security.** Admin pages and APIs are protected twice: by `src/proxy.ts`, and again inside every page and action. Sessions are signed, HTTP-only cookies lasting 12 hours. Login attempts are rate-limited. Use a long, unique `ADMIN_PASSWORD`. Optionally set `ADMIN_SESSION_SECRET`; changing it signs every session out.

## Checkout & payments

Checkout collects contact details, a delivery address with country selection, a shipping method and a payment option. **No payment is simulated.** Because no gateway is connected:

* "Credit / debit card" is shown but disabled ("Coming soon").
* "Reserve & confirm with our team" submits an **order request** to `/api/orders`. The server re-validates the request and recalculates prices from the catalogue, then returns a reference such as `LLG-1A2B3C4D`. The customer sees a "No payment has been taken" confirmation and a WhatsApp button pre-filled with the reference.

To go live, implement `PaymentProvider` in `src/lib/payments` (e.g. Network International N-Genius, Checkout.com, Telr or Stripe). Then enable the card option in `store.ts`.

Customer accounts have a UI only. Connect an auth provider in `src/components/forms/AccountView.tsx`.

## Testing

```bash
npm run build && npm start   # port 3000; or: npx next start -p 3100
BASE=http://localhost:3000 node tests/e2e.cjs                               # storefront (49 checks)
BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/admin-e2e.cjs      # admin (28 checks)
```

Both suites require Playwright with Chromium. The admin suite creates and deletes a test product and places test orders, so run it against a development database, not production.

The suite covers 49 checks:

* **Crawl**: every page in the sitemap and app returns 200, with no broken images, internal links or console errors.
* **Shop**: filters, sorting, empty state, instant search and accent-insensitive search.
* **Cart and checkout**: variant validation, cart drawer, quantity and subtotal updates, persistence across reloads, wishlist, checkout validation, country-dependent shipping, order submission, and API validation.
* **Forms**: newsletter consent and contact form.
* **Mobile**: menu, filter drawer and quick add, plus horizontal-overflow checks on key pages.

## Launch checklist

- [ ] Replace sample products, prices and imagery; set `NEXT_PUBLIC_SAMPLE_CATALOGUE=false`
- [ ] Confirm the WhatsApp/phone country codes and add a contact email
- [ ] Confirm shipping rates and timelines and the policy texts (legal review)
- [ ] Set `ADMIN_PASSWORD` and a production `DATABASE_URL` (PostgreSQL)
- [ ] Connect a payment gateway
- [ ] Add verified testimonials (with permission) or remove the section
- [ ] Set `NEXT_PUBLIC_SITE_URL` and add analytics/cookie consent if required
