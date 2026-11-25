/**
 * Identifies the current watermark (logo artwork + placement). It is part of every watermarked
 * image's address, so browsers and the CDN never keep showing an older version.
 *
 * If the logo or the watermark's look ever changes: re-run scripts/watermark-logo.mjs if needed,
 * bump this value, then run `npm run media`. Built-in images are re-rendered from their originals,
 * and uploaded images are re-watermarked from their originals automatically the next time they're shown.
 */
// w2: the logo sits inside the part of the photo the website's portrait frames show (it was cut off on tall
// phone photos and wide photos).
export const WATERMARK_REVISION = "w2";
