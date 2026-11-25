import "server-only";
import type { WatermarkLogos } from "@/lib/watermark/core";
import { wordmarkInk, wordmarkIvory } from "@/lib/watermark/logo.generated";

let logos: WatermarkLogos | null = null;

/** The LA LUXURY GOLD wordmark (rendered with the site's own wordmark typography) in its two tones, decoded once. */
export function watermarkLogos(): WatermarkLogos {
  return (logos ??= { ink: Buffer.from(wordmarkInk, "base64"), ivory: Buffer.from(wordmarkIvory, "base64") });
}
