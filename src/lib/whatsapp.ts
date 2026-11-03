import { store } from "./config/store";

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${store.contact.whatsapp.e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const defaultWhatsappMessage =
  "Hello LA Luxury Gold, I would like some assistance with your jewellery and gold collection.";

export function productEnquiry(name: string, url?: string) {
  return `Hello LA Luxury Gold, I'm interested in the ${name}${url ? ` (${url})` : ""}. Could you share more details?`;
}
