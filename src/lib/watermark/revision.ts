/**
 * Identifies the current watermark (logo artwork + placement). It is part of every watermarked
 * image's address, so browsers and the CDN never keep showing an older version.
 *
 * If the logo or the watermark's look ever changes: re-run scripts/watermark-logo.mjs if needed,
 * bump this value, then run `npm run media`. Built-in images are re-rendered from their originals,
 * and uploaded images are re-watermarked from their originals automatically the next time they're shown.
 */
// w2: the logo sat inside the part of the photo the website's portrait frames show.
// w3: the brand name "LA LUXURY GOLD", faint and centred, replaces the corner monogram.
// w4: the name is a little more visible: light letters over a soft dark shadow, readable on every photo.
// w5: larger letters (86% of the shown width instead of 62%).
export const WATERMARK_REVISION = "w5";
