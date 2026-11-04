// Convert Cycles PNG renders into the site's image library (WebP).
//   node tools/studio/optimise.cjs <render-dir>
// Writes public/images/laluxurygold/<key>.webp, then run `npm run media` to refresh the manifest.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const src = path.resolve(process.argv[2] || "renders");
const out = path.resolve(__dirname, "../../public/images/laluxurygold");

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}

(async () => {
  let n = 0, bytes = 0;
  for (const f of walk(src).filter((f) => f.endsWith(".png"))) {
    const key = path.relative(src, f).replace(/\\/g, "/").replace(/\.png$/, "");
    const dest = path.join(out, key + ".webp");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    // campaign images are shown full-bleed; keep a little more quality there
    const q = key.startsWith("campaign/") ? 84 : 82;
    await sharp(f).webp({ quality: q, effort: 6, smartSubsample: true }).toFile(dest);
    bytes += fs.statSync(dest).size;
    n++;
  }
  console.log(`${n} images → ${path.relative(process.cwd(), out)} (${(bytes / 1048576).toFixed(1)} MB)`);
})();
