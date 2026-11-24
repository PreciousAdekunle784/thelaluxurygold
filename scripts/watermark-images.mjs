#!/usr/bin/env node
/**
 * Watermarks the built-in product photographs.
 *
 *   assets/originals/products/<name>.webp          the original renders (never modified, not public)
 *   public/images/laluxurygold/products/<name>.<revision>.webp   what the website shows (watermarked)
 *
 * Every output is made from its ORIGINAL, so running this again (or after changing the watermark) can never
 * stack a second watermark. Outputs from older watermark revisions are removed. Run as part of `npm run media`.
 *
 *   node scripts/watermark-images.mjs           # (re)generate
 *   node scripts/watermark-images.mjs --check   # exit 1 if any original has no up-to-date watermarked copy
 */
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { applyWatermark } from "../src/lib/watermark/core.ts";
import { WATERMARK_REVISION } from "../src/lib/watermark/revision.ts";

const root = path.resolve(import.meta.dirname, "..");
const originalsDir = path.join(root, "assets", "originals", "products");
const outDir = path.join(root, "public", "images", "laluxurygold", "products");
const logos = {
  ink: await readFile(path.join(root, "src", "lib", "watermark", "monogram-ink.png")),
  ivory: await readFile(path.join(root, "src", "lib", "watermark", "monogram-ivory.png")),
};
const check = process.argv.includes("--check");

await mkdir(outDir, { recursive: true });
const originals = (await readdir(originalsDir)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();
const expected = new Set(originals.map((f) => `${f.replace(/\.[a-z]+$/i, "")}.${WATERMARK_REVISION}.webp`));

let made = 0, missing = 0, bytes = 0;
for (const file of originals) {
  const name = file.replace(/\.[a-z]+$/i, "");
  const dest = path.join(outDir, `${name}.${WATERMARK_REVISION}.webp`);
  if (check) {
    const [o, d] = await Promise.all([stat(path.join(originalsDir, file)), stat(dest).catch(() => null)]);
    if (!d || d.mtimeMs < o.mtimeMs) { console.log(`missing or outdated: ${path.relative(root, dest)}`); missing++; }
    continue;
  }
  const { data, info } = await sharp(path.join(originalsDir, file)).rotate().toColorspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const out = await applyWatermark({ data, width: info.width, height: info.height, channels: info.channels }, logos);
  if (out.width !== info.width || out.height !== info.height) throw new Error(`${file}: size changed`);
  await writeFile(dest, out.data);
  bytes += out.data.length;
  made++;
}

// Remove watermarked copies that no longer have an original, or belong to an older revision.
for (const f of await readdir(outDir)) {
  if (!expected.has(f)) {
    if (check) { console.log(`stale: ${f}`); missing++; } else await rm(path.join(outDir, f));
  }
}

if (check) {
  console.log(missing ? `${missing} problem(s)` : `all ${originals.length} product images watermarked (${WATERMARK_REVISION})`);
  process.exit(missing ? 1 : 0);
}
console.log(`watermarked ${made} product images (${WATERMARK_REVISION}) → ${path.relative(root, outDir)} (${(bytes / 1048576).toFixed(1)} MB)`);
