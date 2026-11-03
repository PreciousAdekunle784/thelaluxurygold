export type CategorySlug = "rings" | "necklaces" | "bracelets" | "earrings" | "gold-bars";
export type Purity = "18K" | "21K" | "22K" | "24K";
export type Availability = "in_stock" | "low_stock" | "made_to_order" | "out_of_stock";

export interface ProductImage {
  /** Key in the media registry (src/lib/data/media.ts). */
  media: string;
  alt: string;
}

export interface VariantOption {
  value: string;
  /** Price difference in AED relative to the base price. */
  priceDeltaAED?: number;
  available?: boolean;
}

export interface ProductVariant {
  name: "Ring size" | "Chain length" | "Bracelet size" | "Weight";
  options: VariantOption[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  collections: string[];
  purity: Purity;
  /** Weight in grams, where known. */
  weightGrams?: number;
  /** Price in AED. `null` means price on request. */
  priceAED: number | null;
  compareAtAED?: number;
  availability: Availability;
  tagline: string;
  description: string[];
  specs: ProductSpec[];
  variants?: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
  /** Relative popularity used for sorting (higher = more popular). */
  popularity: number;
  featured?: boolean;
  isNew?: boolean;
  /** True for development preview data. Never set on verified products. */
  isSample: boolean;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  singular: string;
  intro: string;
  media: string;
}

export interface Collection {
  slug: string;
  name: string;
  intro: string;
  media: string;
}
