import "server-only";
import type { WatermarkLogos } from "@/lib/watermark/core";
import { monogramInk, monogramIvory } from "@/lib/watermark/logo.generated";

let logos: WatermarkLogos | null = null;

/** The LA Luxury Gold monogram (rendered from the site's own Logo component) in its two tones, decoded once. */
export function watermarkLogos(): WatermarkLogos {
  return (logos ??= { ink: Buffer.from(monogramInk, "base64"), ivory: Buffer.from(monogramIvory, "base64") });
}
