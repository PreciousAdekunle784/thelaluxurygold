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

* **Type**: Cormorant Garamond for display (uppercase with italic lowercase accents); Manrope for UI and body text. Small uppercase "eyebrows" use 0.28em tracking.
* **Logo**: a typographic wordmark ("LA LUXURY GOLD" with a "Dubai" line) and an **LG monogram set inside an arch**, a nod to Dubai architecture. It works on light and dark backgrounds: `src/components/brand/Logo.tsx`, plus `src/app/icon.png` and `apple-icon.png`.
* **Components**: square-edged buttons, hairline dividers, arch-masked imagery used once, and restrained motion (fade-up reveals, slow image scale, mask-reveal hero type). Motion respects `prefers-reduced-motion`.

## Project structure

```
src/app/                 Routes: home, shop, collections/[slug], gold-bars, product/[slug],
                         cart, checkout, wishlist, account, about, contact, faq, shipping,
                         returns, privacy, terms, api/{orders,newsletter,contact}, sitemap, robots
src/components/          brand · layout · home · shop · product · cart · forms · ui
src/lib/config/store.ts  Business settings: contact numbers, socials, currencies, shipping, payment options
src/lib/data/            Catalogue (products.ts), categories & collections, testimonials, media registry
src/lib/data/catalogue.ts   Data-access layer (search, filter, sort). Swap the data source here.
src/lib/state/           Cart, wishlist and currency providers (persisted to localStorage)
src/lib/server/          Order validation & persistence, webhook forwarding
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

### Imagery

All photography is **placeholder still-life imagery rendered in a 3D studio** (`tools/render`): gold rings, chains, bangles, earrings and bars on travertine, silk and seamless backdrops. It contains no third-party stock or brand assets. Each product has three images: a studio shot, a styled shot (used for the hover swap) and a detail close-up.

To replace an image, drop a new file at the same key under `public/images/` (keep the aspect ratio: products 4:5), then run:

```bash
npm run media                       # rebuild sizes + blur placeholders
npm run media -- --import ./photos  # or convert a folder of JPG/PNG to WebP first
```

Products reference images by key (e.g. `products/aurelia-band-1`) in `src/lib/data/products.ts`.

## Configuration

| Env var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and structured data |
| `NEXT_PUBLIC_SAMPLE_CATALOGUE` | Set to `false` once verified products are loaded (enables indexing, removes labels) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional public email |
| `ORDER_WEBHOOK_URL` | Receives order requests as JSON (CRM, email automation, Make/Zapier, Sheets…) |
| `NEWSLETTER_WEBHOOK_URL` | Receives newsletter sign-ups |
| `CONTACT_WEBHOOK_URL` | Receives contact-form messages |

Without webhooks, submissions are validated and logged on the server.

* **Currency**: AED is the base currency. USD, EUR, GBP and SAR are defined in `store.ts` with `rate: null`. Give one a rate (ideally from a rates service) and it appears automatically in the currency layer.
* **Shipping**: methods are defined in `store.ts`. Rates and delivery estimates are `null` (shown as "confirmed by our team") until you set them. No rates or timelines were invented.
* **WhatsApp**: the main number `08149734675` is used in international format (`+234 814 973 4675`, assumed Nigerian). UAE `+971 50 625 9597` and secondary `+234 814 966 6013` are listed on the contact page and in the footer. Change these in `store.contact`.

## Checkout & payments

Checkout collects contact details, a delivery address with country selection, a shipping method and a payment option. **No payment is simulated.** Because no gateway is connected:

* "Credit / debit card" is shown but disabled ("Coming soon").
* "Reserve & confirm with our team" submits an **order request** to `/api/orders`. The server re-validates the request and recalculates prices from the catalogue, then returns a reference such as `LLG-1A2B3C4D`. The customer sees a "No payment has been taken" confirmation and a WhatsApp button pre-filled with the reference.

To go live, implement `PaymentProvider` in `src/lib/payments` (e.g. Network International N-Genius, Checkout.com, Telr or Stripe). Then enable the card option in `store.ts`.

Customer accounts have a UI only. Connect an auth provider in `src/components/forms/AccountView.tsx`.

## Testing

```bash
npm run build && npm start   # port 3000; or: npx next start -p 3100
BASE=http://localhost:3000 node tests/e2e.cjs   # requires Playwright with Chromium
```

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
- [ ] Connect a payment gateway and order webhook / database
- [ ] Add verified testimonials (with permission) or remove the section
- [ ] Set `NEXT_PUBLIC_SITE_URL` and add analytics/cookie consent if required
