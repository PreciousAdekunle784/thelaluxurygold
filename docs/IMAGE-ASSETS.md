# LA Luxury Gold — image library

All imagery on the site lives in `public/images/laluxurygold/` and is referenced by key through the
media registry (`src/lib/data/media.ts`), e.g. `products/maison-signet-1` →
`/images/laluxurygold/products/maison-signet-1.webp`. Run `npm run media` after adding or replacing files
to refresh dimensions and blur placeholders.

## How these images were made

**Every image is an original 3D render, not a photograph.** They were produced in this repository with
Blender Cycles, a physically based path tracer (`tools/studio/`). The gold is modelled as metal with real
optical constants, and the silk, velvet, stone and lacquer are physically based materials lit by studio
lights. The pieces are modelled procedurally from each product's description. No stock photography, scans,
third-party assets or AI image generators were used, so there are no licensing restrictions.

They are the rendered equivalent of a studio and campaign shoot. They are **not** photographs of the
specific items for sale. To keep that honest, every starting product carries `illustrativeImages: true`, and
its product page shows a short note: "Images are studio renderings of this design. Ask us on WhatsApp for
photographs of the piece itself." Untick **Images are studio renders** in Admin → Products once a product
has real photographs.

No image contains text, logos, hallmarks, weights or certification marks. The gold bars are deliberately
unmarked.

## Why there is no model photograph

The brief asked for a signature campaign photograph of a fashion model wearing the jewellery. This
environment could not produce that honestly:

- No image-generation tool or service was available. There is no image model and no API key.
- Licensed photo libraries were blocked by the environment's network policy (images.unsplash.com,
  pexels.com, pixabay.com and Wikimedia all returned HTTP 403), as were laluxurygoldworld.com and
  thegrandsouq.com.
- A convincing human figure cannot be modelled procedurally. A fake-looking person would harm the brand
  more than help it.

The signature campaign therefore uses a **burgundy velvet jewellery display bust** on obsidian, wearing
three layered chains, the Médaille and a teardrop. This is a classic jewellery-advertising composition.

**To add a model campaign**, use one of these:

1. A real photoshoot (recommended for launch). Upload the image in **Admin → Store settings → Homepage
   hero**: a landscape image for desktop and a portrait version for phones. Keep the subject in the right
   third (desktop) and the lower half (phones), leaving room for the headline.
2. Licensed stock. Add `images.unsplash.com` / `images.pexels.com` to the environment's allowed domains,
   then choose and license an image.
3. AI generation, if you have access to an image model. Generate it and upload it the same way. Do not
   present generated jewellery as a specific item for sale.

## Asset list

| Key | Size | Shows | Used on |
| --- | --- | --- | --- |
| `campaign/hero-desktop` | 2560×1440 | Velvet bust with layered chains and the Médaille, obsidian with a burgundy halo; dark space on the left | Hero slide 1 (desktop), social share image |
| `campaign/hero-mobile` | 1080×1920 | Same set, composed for phones with headroom for the headline | Hero slide 1 (phones) |
| `campaign/campaign-burgundy` | 2560×1280 | 22K bangle, open cuff and rope chain on burgundy silk, raking light | Hero slide 2 |
| `campaign/campaign-burgundy-mobile` | 1080×1920 | The burgundy silk set, composed for phones | Hero slide 2 (phones) |
| `campaign/emerald-desktop` / `campaign/emerald-mobile` | 2560×1440 / 1080×1920 | Stacked bangles, an open cuff and a cable bracelet on emerald velvet | Hero slide 3 |
| `campaign/gold-bars-mobile` | 1080×1920 | Cast and minted bars on obsidian, composed for phones | Hero slide 4 (phones) |
| `campaign/gold-texture-mobile` | 1080×1920 | Macro of a 22K rope chain, composed for phones | Hero slide 5 (phones) |
| `campaign/band-necklace-desktop` / `-mobile` | 2560×1300 / 1080×1920 | Close-up of layered chains and the medallion on the velvet bust | Homepage campaign band (Necklaces) |
| `campaign/band-earrings-desktop` / `-mobile` | 2560×1300 / 1080×1920 | Hoops, drop earrings and a huggie on burgundy velvet | Homepage campaign band (Earrings) |
| `campaign/bars-feature-desktop` / `-mobile` | 2560×1440 / 1080×1920 | Cast bar beside a stack of minted bars on obsidian | Homepage 24K gold bars section |
| `campaign/campaign-editorial` | 2400×1600 | Bright editorial: rings, bangle and chain on travertine with window-light shadows | Fine Jewellery banner, Our Story, Signature mega-menu tile |
| `campaign/gold-bars-wide` | 2400×1350 | Cast and minted bars on polished obsidian | Hero slide 4, homepage gold-bars section, Gold Bars page, Investment Gold collection |
| `collections/collection-rings` | 1600×2000 | Four rings on a travertine plinth in sunlight | Rings category |
| `collections/collection-necklaces` | 1600×2000 | Chains coiled on a stone drum, champagne backdrop | Necklaces category |
| `collections/collection-bracelets` | 1600×2000 | Bangles, cuff and link bracelet on emerald velvet | Bracelets category |
| `collections/collection-earrings` | 1600×2000 | Hoops, drops and a huggie on obsidian | Earrings category |
| `collections/collection-sets` | 1600×2000 | Pendant and hoops in an open burgundy gift box | Jewellery Sets category |
| `collections/collection-gold-bars` | 1600×2000 | Stacked minted and cast bars on obsidian | Gold Bars category, mega menu |
| `details/gold-texture` | 2000×1400 | Macro of a 22K rope chain on dark silk | Hero slide 5 (desktop) |
| `details/jewellery-craftsmanship` | 2000×1400 | Signet ring above a cable chain on travertine | Not currently used (kept for future editorial use) |
| `details/premium-packaging` | 1600×2000 | Signet in an open burgundy presentation box | Client confidence, Gift Edit |
| `brand/our-story` | 1600×2000 | Band, bangle and chain on ivory silk beside a gift box | Our Story page, Signature Edit |
| `products/<product>-1` | 1200×1500 | Studio shot on an ivory seamless backdrop | Product cards, gallery |
| `products/<product>-2` | 1200×1500 | Styled shot (stone, silk, velvet or obsidian) | Hover image, gallery, The Edit |
| `products/<product>-3` | 1200×1500 | Macro detail | Gallery (zoomable) |

The products are aurelia-band, maison-signet, corda-twist, soleil-dome, riviera-cable-chain,
medaille-coin-pendant, corde-rope-chain, goutte-teardrop-pendant, halo-bangle, arc-cuff,
riviera-cable-bracelet, classic-hoops, petite-huggies, goutte-drop-earrings, minted-gold-bar-5g / 10g / 20g /
50g, cast-gold-bar-100g, riviera-set and soleil-halo-set.

## Replace before launch

- [ ] **Product images (63 files):** replace with photographs of the actual pieces, then untick
      "Images are studio renders" for each product. Upload in Admin → Products, or drop files at the same
      paths (4:5, at least 1200 px wide) and run `npm run media`.
- [ ] **Signature campaign:** add a real campaign photograph (see above). This is optional; the render
      works as a campaign image.
- [ ] Review the catalogue itself in the admin. Names, weights, sizes and prices are the starting
      catalogue, not verified stock.

## Re-rendering

```bash
python3.13 -m venv .venv-studio && .venv-studio/bin/pip install bpy   # Blender 5.x as a Python module
.venv-studio/bin/python tools/studio/render.py renders                 # all 83 images (~2–3 h on 4 CPU cores)
.venv-studio/bin/python tools/studio/render.py renders --preview hero  # fast low-res composition check
node tools/studio/optimise.cjs renders && npm run media
```

Scenes are defined in `tools/studio/scenes.py`. Models, materials and lights are in `tools/studio/lib.py`.
