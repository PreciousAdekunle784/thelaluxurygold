import { categories, collections } from "@/lib/data/categories";

export const mainNav: { label: string; href: string; menu?: "shop" | "collections" }[] = [
  { label: "Shop", href: "/shop", menu: "shop" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Collections", href: "/collections", menu: "collections" },
  { label: "Fine Jewellery", href: "/fine-jewellery" },
  { label: "Gold Bars", href: "/gold-bars" },
  { label: "Our Story", href: "/about" },
];

export const shopMenu = {
  categories: [...categories.map((c) => ({ label: c.name, href: c.slug === "gold-bars" ? "/gold-bars" : `/collections/${c.slug}` })), { label: "Shop all", href: "/shop" }],
  purity: ["18K", "21K", "22K", "24K"].map((p) => ({ label: `${p} gold`, href: `/shop?purity=${p}` })),
  discover: [
    { label: "New arrivals", href: "/new-arrivals" },
    { label: "Fine jewellery", href: "/fine-jewellery" },
    { label: "Most loved", href: "/shop?sort=popular" },
    { label: "The Gift Edit", href: "/collections/gifting" },
    { label: "Wishlist", href: "/wishlist" },
  ],
};

export const collectionsMenu = collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}`, intro: c.intro, media: c.media }));

export const footerNav = {
  shop: [
    { label: "Rings", href: "/collections/rings" },
    { label: "Necklaces", href: "/collections/necklaces" },
    { label: "Bracelets", href: "/collections/bracelets" },
    { label: "Earrings", href: "/collections/earrings" },
    { label: "Jewellery Sets", href: "/collections/sets" },
    { label: "Gold Bars", href: "/gold-bars" },
    { label: "Shop all", href: "/shop" },
  ],
  service: [
    { label: "Contact us", href: "/contact" },
    { label: "Shipping & delivery", href: "/shipping" },
    { label: "Returns & exchanges", href: "/returns" },
    { label: "Frequently asked questions", href: "/faq" },
    { label: "Track your order", href: "/account" },
  ],
  house: [
    { label: "Our story", href: "/about" },
    { label: "New arrivals", href: "/new-arrivals" },
    { label: "Collections", href: "/collections" },
    { label: "Gold Bars", href: "/gold-bars" },
  ],
  legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms & conditions", href: "/terms" },
  ],
};
