-- =============================================================================
-- LA Luxury Gold — database schema for Supabase (PostgreSQL)
--
-- How to use:
--   1. Supabase dashboard → SQL Editor → New query → paste this file → Run.
--   2. Project Settings → Database → Connection string → "Transaction pooler"
--      (port 6543). Copy it, replace [YOUR-PASSWORD], and set it as DATABASE_URL
--      in your hosting environment (e.g. Vercel → Settings → Environment Variables).
--   3. Deploy. On first start the website copies the sample catalogue into the
--      `products` table (once), then everything is managed from /admin.
--
-- The app talks to the database directly from the server with this connection
-- string. Row Level Security is switched ON for every table with no policies, so
-- Supabase's public Data API (anon / authenticated keys) cannot read or change
-- anything — customer details and orders stay private.
--
-- Safe to run more than once. Payments are not part of this schema yet.
-- =============================================================================

-- Key/value settings used by the app (e.g. "catalogue_seeded").
create table if not exists meta (
  key   text primary key,
  value text
);

-- Products. `data` holds the full product as JSON (name, price in AED, purity,
-- weight, images, options, specifications…) exactly as edited in /admin.
create table if not exists products (
  id         text primary key,
  slug       text unique not null,            -- web address: /product/<slug>
  position   integer not null default 0,      -- display order (lower first)
  archived   integer not null default 0,      -- 1 = hidden from the store
  data       text not null,                   -- product JSON
  updated_at bigint not null                  -- milliseconds since epoch
);

-- Orders placed through checkout (order requests — no payment is taken online yet).
create table if not exists orders (
  reference    text primary key,              -- e.g. LLG-1A2B3C4D
  created_at   bigint not null,               -- milliseconds since epoch
  day          text not null,                 -- YYYY-MM-DD in Dubai time
  status       text not null,                 -- pending_confirmation | confirmed | paid | shipped | delivered | cancelled
  email        text not null,
  name         text not null,
  phone        text,
  country      text,                          -- ISO country code, e.g. AE
  subtotal_aed bigint not null default 0,
  item_count   integer not null default 0,
  has_por      integer not null default 0,    -- 1 = contains "price on request" items
  data         text not null,                 -- full order JSON (items, address, notes…)
  history      text not null,                 -- status history JSON
  updated_at   bigint not null
);
create index if not exists orders_created on orders (created_at);
create index if not exists orders_email   on orders (email);

-- Anonymous page views (no IP addresses or personal data).
create table if not exists page_views (
  id         text primary key,
  ts         bigint not null,                 -- milliseconds since epoch
  day        text not null,                   -- YYYY-MM-DD in Dubai time
  visitor_id text not null,                   -- random ID stored in the visitor's browser
  session_id text,
  path       text not null,
  referrer   text,
  country    text,
  device     text,
  browser    text,
  is_new     integer not null default 0
);
create index if not exists pv_ts  on page_views (ts);
create index if not exists pv_day on page_views (day);

-- Newsletter sign-ups.
create table if not exists subscribers (
  email      text primary key,
  source     text,
  created_at bigint not null
);

-- Contact-form messages.
create table if not exists messages (
  id         text primary key,
  created_at bigint not null,
  name       text,
  email      text,
  phone      text,
  topic      text,
  message    text,
  is_read    integer not null default 0
);

-- Product images uploaded in /admin (WebP, served from /media/<id>).
create table if not exists media (
  id           text primary key,
  content_type text not null,
  width        integer,
  height       integer,
  bytes        bytea not null,
  created_at   bigint not null
);

-- -----------------------------------------------------------------------------
-- Security: block Supabase's public Data API from every table.
-- -----------------------------------------------------------------------------
alter table meta        enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table page_views  enable row level security;
alter table subscribers enable row level security;
alter table messages    enable row level security;
alter table media       enable row level security;

-- -----------------------------------------------------------------------------
-- Optional: readable views for browsing data in the Supabase Table Editor.
-- security_invoker keeps them behind the same Row Level Security as the tables.
-- -----------------------------------------------------------------------------
create or replace view product_overview with (security_invoker = true) as
select
  id,
  slug,
  data::jsonb ->> 'name'                    as name,
  data::jsonb ->> 'category'                as category,
  data::jsonb ->> 'purity'                  as purity,
  (data::jsonb ->> 'priceAED')::numeric     as price_aed,
  (data::jsonb ->> 'weightGrams')::numeric  as weight_grams,
  data::jsonb ->> 'availability'            as availability,
  archived = 1                              as hidden,
  to_timestamp(updated_at / 1000.0)         as updated
from products
order by position;

create or replace view order_overview with (security_invoker = true) as
select
  reference,
  to_timestamp(created_at / 1000.0) as placed_at,
  status,
  name,
  email,
  phone,
  country,
  item_count,
  subtotal_aed
from orders
order by created_at desc;
