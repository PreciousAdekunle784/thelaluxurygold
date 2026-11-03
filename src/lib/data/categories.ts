import type { Category, Collection } from "./types";

export const categories: Category[] = [
  {
    slug: "rings",
    name: "Rings",
    singular: "Ring",
    intro: "Bands, signets and sculptural domes in 18K to 22K gold — made to be worn every day and kept for a lifetime.",
    media: "editorial/category-rings",
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    singular: "Necklace",
    intro: "Fluid chains and polished pendants, designed to rest beautifully at the neckline alone or layered.",
    media: "editorial/category-necklaces",
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    singular: "Bracelet",
    intro: "Bangles, cuffs and link bracelets with a confident presence on the wrist.",
    media: "editorial/category-bracelets",
  },
  {
    slug: "earrings",
    name: "Earrings",
    singular: "Earrings",
    intro: "From essential hoops to luminous drops — gold that frames the face.",
    media: "editorial/category-earrings",
  },
  {
    slug: "gold-bars",
    name: "Gold Bars",
    singular: "Gold Bar",
    intro: "24K gold bars in a range of weights — a timeless way to own a piece of enduring value.",
    media: "editorial/category-bars",
  },
];

export const collections: Collection[] = [
  {
    slug: "signature",
    name: "The Signature Edit",
    intro: "Our most distinctive pieces — sculpted silhouettes that define the house of LA Luxury Gold.",
    media: "editorial/story",
  },
  {
    slug: "everyday-gold",
    name: "Everyday Gold",
    intro: "Refined essentials designed to be worn daily, layered freely and loved for years.",
    media: "editorial/social-2",
  },
  {
    slug: "gifting",
    name: "The Gift Edit",
    intro: "Meaningful pieces for milestones, celebrations and the people who matter most.",
    media: "editorial/social-6",
  },
  {
    slug: "investment-gold",
    name: "Investment Gold",
    intro: "24K gold bars — minted and cast — for those who wish to own something that lasts.",
    media: "editorial/investment",
  },
];

export const purities = ["18K", "21K", "22K", "24K"] as const;

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}
