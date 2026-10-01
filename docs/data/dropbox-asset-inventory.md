# Dropbox asset inventory: Skreed product renders

Source: Dropbox namespace `ns:15076266947//amazon product listings` (display path
`/Product Images Folder/amazon product listings`), listed recursively on 2026-10-01.
Scratch data: `scratchpad/dropbox/entries.jsonl` (11,506 entries: 10,767 files, 739 folders).

Other namespaces checked recursively and confirmed **empty** (0 entries):
`ns:15081655283//Creatives Folder`, `ns:15081655283//Zeosmobile Team Folder`,
`ns:15081655283//Prem Vuthandam`.

## 1. Headline numbers

| Metric | Value |
|---|---|
| Total files | 10,767 (10,766 PNG + 1 JPG), ~12.9 GB |
| Product renders (series/case/family/device/shade) | 10,080 PNG |
| Unique renders (magtough and tough are byte-identical copies) | 5,040 |
| Series | 6: 15, 16, 17, Pixel 10, S25, S26 |
| Devices | 21 (4 per iPhone series, 3 per Samsung/Pixel series) |
| Case-type folders with renders | 2: `magtough`, `tough` |
| Case-type folders that are empty scaffolding | 2 (17 series only): `armour`, `snap` |
| Colour families | 10 |
| Shades | 240 (exactly 24 per family, same set in every series/case) |
| Renders per device | 240 (10 families x 24 shades), per case type |
| Filename suffix | only `_A1` (10,080/10,080) |
| Render file size | min 0.63 MB, median 1.13 MB, p90 1.40 MB, max 1.59 MB |
| Supporting "common images" (lifestyle, feature, compatibility) | 423 |
| Swatch PNGs | 264 (11 folders x 24) |
| Render dates | 2026-09-08 to 2026-09-11; common images up to 2026-09-30 |

## 2. Folder tree

```
amazon product listings/
  15 series/        {magtough, tough}/{family}/{15, 15 plus, 15 pro, 15 pro max}/{Shade}_A1.png
  16 series/        {magtough, tough}/{family}/{16, 16 plus, 16 pro, 16 pro max}/{Shade}_A1.png
  17 series/        {magtough, tough}/{family}/{17, 17 air, 17 pro, 17 pro max}/{Shade}_A1.png
                    {armour, snap}/{family}/{device}/      <- 80 EMPTY folders, no files
  Pixel 10 series/  {magtough, tough}/{family}/{Pixel 10, Pixel 10 Pro, Pixel 10 Pro XL}/{Shade}_A1.png
  S25 series/       {magtough, tough}/{family}/{S25, S25 Plus, S25 Ultra}/{Shade}_A1.png
  S26 series/       {magtough, tough}/{family}/{S26, S26 Plus, S26 Ultra}/{Shade}_A1.png
  common images/    {family} {series}/A3-lifestyle-<Device>.png, A4-dual-layer-defense.png,
                                      A5-finishes.png, A7-comparison-<colour>.png
                    compatibility {series}/A6-compatibility-<Device>.png
  swatches/         {colour} circle/{Shade}_SWCH.png   (+ a duplicate "roaring red 17 series" folder)
```

Family folder names (lower case, used identically everywhere):
`basic brown`, `blissful blue`, `blushing coral`, `frosty white`, `go green`,
`mellow yellow`, `playful pink`, `roaring red`, `stormy grey`, `vivid violet`.

Example full path:
`ns:15076266947//amazon product listings/17 series/magtough/roaring red/17 pro/Crimson_A1.png`

## 3. Counts

### Renders by series and case type

| Series | Devices | magtough | tough | Total | Unique (dedup) |
|---|---|---|---|---|---|
| 15 series | 15, 15 plus, 15 pro, 15 pro max | 960 | 960 | 1,920 | 960 |
| 16 series | 16, 16 plus, 16 pro, 16 pro max | 960 | 960 | 1,920 | 960 |
| 17 series | 17, 17 air, 17 pro, 17 pro max | 960 | 960 | 1,920 | 960 |
| Pixel 10 series | Pixel 10, Pixel 10 Pro, Pixel 10 Pro XL | 720 | 720 | 1,440 | 720 |
| S25 series | S25, S25 Plus, S25 Ultra | 720 | 720 | 1,440 | 720 |
| S26 series | S26, S26 Plus, S26 Ultra | 720 | 720 | 1,440 | 720 |
| **Total** | 21 | 5,040 | 5,040 | **10,080** | **5,040** |

Every (series, case, family) cell is complete: 96 files for iPhone series (4 devices x 24),
72 for Samsung/Pixel (3 x 24). Every device folder holds exactly 240 renders.

### Non-render files

| Bucket | Files | Notes |
|---|---|---|
| common images / A3-lifestyle | 218 | 217 PNG + 1 JPG; one per device per family (210) + 7 `-alt` variants + 1 un-suffixed `A3-lifestyle.jpg` |
| common images / A4-dual-layer-defense | 60 | one per family x series folder |
| common images / A5-finishes | 60 | one per family x series folder |
| common images / A6-compatibility | 24 | 21 in `compatibility {series}` folders + 3 extra in `roaring red 17 series` |
| common images / A7-comparison-{colour} | 60 | one per family x series folder (same file reused across series) |
| common images / A8-brand-story | 1 | only in `roaring red 17 series` |
| swatches | 264 | 24 per colour circle; `roaring red 17 series` folder duplicates `red circle` |

The single non-PNG file: `common images/roaring red 17 series/A3-lifestyle.jpg`.
Common-image sizes: 0.4 to 10 MB, median 4.1 MB (lifestyle shots are the largest).

### What does NOT exist anywhere

- No logos, brand marks, fonts or vector files.
- No videos, GIFs or animations.
- No PSD/AI/TIFF source files, no colour-profile or spec documents.
- No multi-angle renders (no `_A2`, back, side, or in-hand product-only shots).
- No renders for `armour` or `snap` case types (folders exist for 17 series only, all empty).
- No MagSafe-specific artwork: `magtough` is a straight copy of `tough`.

## 4. Filename pattern and suffixes

Render pattern: `{Shade}_A1.png` where `{Shade}` is Title-Case, multi-word joined with `-`
(e.g. `Scarlet-Red`, `Dark-chocolate`, `Off-white`, `Pumpkin-spice`; casing is not perfectly
consistent). Only suffix present is `_A1`.

Interpretation: the Amazon listing image slots are numbered A1..A8 across the whole folder
(`A3-lifestyle`, `A4-dual-layer-defense`, `A5-finishes`, `A6-compatibility`, `A7-comparison`,
`A8-brand-story`). `_A1` is therefore the **main/hero product image** (front-facing single
case render). A2 (presumably a second angle) was never produced; no A2 files exist.

Swatch pattern: `{Shade}_SWCH.png` (1.4 to 43 KB, median 2.5 KB), small colour circles.
Swatch shade names match render shade names exactly for all 10 families (0 mismatches).

## 5. Shade list (24 per family, identical across all series and both case types)

- **basic brown**: Almond, Beige, Brick, Bronze, Brunette, Chestnut, Chocolate, Cider, Cinnamon, Cocoa, Coffee, Dark-chocolate, Desert, Light-Brown, Peanut, Peru, Rosy-Brown, Russet, Sand, Taupe, Umber, Walnut, Wenge, Wood
- **blissful blue**: Aqua, Aquamarine, Azure, Baby-Blue, Blueberry, Classic-Blue, Cobalt, Cyan, Egyptian-Blue, Electric-Blue, Indigo-Blue, Midnight-Blue, Navy-Blue, Ocean, Pigeon-Blue, Powder-Blue, Prussian, Royal-Blue, Sapphire, Sky-Blue, Space-Blue, Stone-Blue, Teal-Blue, Turquoise
- **blushing coral**: Amber, Apricot, Autumn, Bellini, Bright-Coral, Clay, Clementine, Fire, Ginger, Honey, Mango, Maple, Marmalade, Melon, Neon-Orange, Orange-Peel, Persian, Pumpkin-spice, Rust, Saffron, Sunset, Tangelo, Tangerine, True-coral
- **frosty white**: Alabaster, Antique, Bone, Chiffon, Coconut, Cotton, Cream, Daisy, Eggshell, Frost, Ivory, Lace, Linen, Mist, Oatmeal, Off-white, Oyster, Parchment, Pearl, Porcelain, Rice, Seashell, Snowflake, Vanilla
- **go green**: Army-Green, Basil-Green, Emerald-Green, Fern, Forest-Green, Green-Apple, Green-Tea, Hunter-Green, Jade-Green, Khaki, Lawn-Green, Light-Green, Lime-Green, Mint-Green, Neon-Green, Olive-Green, Pastel-Green, Pear-Green, Persian-Green, Pine-Green, Pistachio, Sage, Teal-Green, Thyme
- **mellow yellow**: Banana, Bright-Yellow, Bumblebee, Buttercup, Canary, Chamomile, Citrine, Custard, Daffodil, Dandelion, Dijon, Golden, Lemon, Lemonade, Limoncello, Mimosa, Mustard, Neon-Yellow, Pale-Yellow, Pastel-Yellow, Sunbeam, Sunflower, Sunshine, Tuscany
- **playful pink**: Baby-Pink, Ballerina, Berry, Blush, Bright-Pink, Bubblegum, Camellia, Crepe, Doll, Flamingo, Fuchsia, Gumball, Light-Pink, Magenta, Neon-Pink, Orchid, Pastel-Pink, Peachy, Peony, Punch, Rose, Rouge, Salmon-Pink, Watermelon
- **roaring red**: Apple, Blood-Red, Burgundy, Cherry-Red, Chilli-Red, Claret, Classic-Red, Crimson, Hibiscus, Imperial-Red, Mahogany, Maroon, Mars, Paprika, Pastel-Red, Raspberry, Red-Currant, Red-Wine, Rose-Red, Ruby-Red, Scarlet-Red, Strawberry, Terracotta, Vermillion
- **stormy grey**: Ash-Grey, Charcoal, Cool-Grey, Dark-Grey, Dolphin, Dove, Fog-Grey, Graphite, Harbor-Grey, Iron-Grey, Koala-Grey, Lava-Grey, Mouse-Grey, Pale-Grey, Pastel-Grey, Pearl-Grey, Rhino-Grey, Shadow, Shark-Grey, Silver-Grey, Smoke-Grey, Steel-Grey, Stone-Grey, Warm-Grey
- **vivid violet**: Amethyst, Bright-Violet, Classic-Violet, Eggplant, Elderberry, Fig, Grape, Indigo, Iris, Lavender, Light-Purple, Lilac, Mauve, Midnight, Mulberry, Pale-Violet, Pastel-Purple, Plum, Psychedelic, Purple-Orchid, Royal, Ultraviolet, Wildberry, Wine

## 6. Gaps and anomalies

1. **magtough == tough.** Sampled pairs across 15/17/Pixel 10/S26 series have identical Dropbox
   `content_hash`, and all 5,040 magtough/tough pairs have identical byte sizes. There is no
   distinct MagSafe-ring render; the MagTough listing reuses the Tough image.
2. **armour / snap: 80 empty device folders** under `17 series` only (10 families x 4 devices
   x 2 case types). No armour/snap folders at all for 15, 16, Pixel 10, S25, S26.
3. **Only one angle (`_A1`) per shade.** No back/side/in-hand product renders.
4. **Lifestyle (A3) images are per family x device, not per shade** - 210 base images plus 7
   `-alt` variants (Pixel 10, Pixel 10 Pro XL, S25 Plus, S26 Ultra x2, iPhone 16). The A4/A5/A7
   feature images are per family and reused across series (identical sizes).
5. **Inconsistent extras in `roaring red 17 series`**: it holds A6 compatibility and A8 brand
   story files that other family folders lack, plus the lone JPG. Looks like the pilot listing.
6. **Swatches folder has a stray duplicate**: `swatches/roaring red 17 series` is a copy of
   `swatches/red circle`.
7. **Shade-name casing is not uniform** (`Dark-chocolate`, `Off-white`, `Pumpkin-spice`,
   `True-coral` vs `Light-Brown`). Normalise when mapping to product/variant names.
8. **No device-less or series-less renders** - every render is tied to one device; there is no
   generic "case only" hero.
9. Transparency / background colour could not be verified from inside this sandbox (the proxy
   blocks `dl.dropboxusercontent.com`); PNG format at 0.6 to 1.6 MB is consistent with either a
   flattened white Amazon-style hero or an RGBA cut-out. Check one file before building the teaser.

## 7. Recommendations for the web teaser

- **Use the `_A1` renders from `tough/`** (the `magtough/` copies are identical, so pick one
  tree and ignore the other; `tough` is the generic name). Source path template:
  `ns:15076266947//amazon product listings/{series}/tough/{family}/{device}/{Shade}_A1.png`
- **Hero device per platform:** `17 series/tough/{family}/17 pro/`, `S26 series/tough/{family}/S26 Ultra/`,
  `Pixel 10 series/tough/{family}/Pixel 10 Pro/`. These are the newest flagships and every family
  has all 24 shades for them.
- **Colour wheel / family picker:** one representative shade per family, e.g. Crimson (red),
  Cobalt (blue), Sage (green), Sunflower (yellow), Fuchsia (pink), True-coral (coral),
  Amethyst (violet), Charcoal (grey), Chocolate (brown), Ivory (white). Pair with the matching
  `swatches/{colour} circle/{Shade}_SWCH.png` for the picker dots (tiny, 2 to 3 KB each).
- **Background:** before committing to a page background, download one `_A1` and check the PNG
  colour type (RGBA vs RGB). If RGBA with transparent background, place on any brand colour.
  If flattened on white (typical Amazon main-image spec), either keep a white/off-white section
  behind the renders or run a one-off background removal (Adobe `image_remove_background` is
  available in this workspace) on the ~30 hero renders only.
- **Lifestyle / mood shots:** reuse `common images/{family} {series}/A3-lifestyle-<Device>.png`
  (4 to 9 MB each - compress/resize to WebP before publishing). Good candidates for the teaser
  banner: the `-alt` variants in `vivid violet 16 series`, `playful pink Pixel 10 series`,
  `blushing coral S26 series`.
- **Feature callouts:** `A4-dual-layer-defense.png`, `A5-finishes.png` and `A7-comparison-*.png`
  are family-agnostic (identical across series) and can be lifted from any one family folder.
- **Do not promise armour/snap or MagSafe-specific visuals** on the teaser; those renders do not
  exist yet.
- **Weight budget:** ~1.1 MB per render at source. Plan to downscale to 800 to 1200 px and
  convert to WebP; 30 hero renders would otherwise be ~33 MB.
