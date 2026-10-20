# Section 3's answer pictures, step 1 of 2: the licensed Envato downloads to masters. Long side 1400 px, sRGB, JPEG q82,
# no metadata (EXIF, ICC and XMP dropped after converting to sRGB). Input: a folder of the downloads, each renamed to its
# key from src/config/quiz-pictures.ts (q0-main.jpg ...); untrusted files, read only. Output: src/assets/quiz/pics/, which
# git ignores (the licence does not allow the files to be shared; the repository is public). Step 2:
# node scripts/quiz/encode-pictures.mjs.   Run from outside the download folder:
#   python3 -I scripts/quiz/prepare-pictures.py <downloads folder> src/assets/quiz/pics
import sys, os, io
from PIL import Image, ImageOps, ImageCms
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 120_000_000
srgb = ImageCms.createProfile('sRGB')
for name in sorted(os.listdir(src)):
    if not name.startswith('q') or not name.lower().endswith(('.jpg', '.jpeg', '.png')): continue
    key = name.rsplit('.', 1)[0]
    with Image.open(os.path.join(src, name)) as im:
        im = ImageOps.exif_transpose(im)
        icc = im.info.get('icc_profile')
        if icc:
            try: im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode='RGB')
            except Exception: im = im.convert('RGB')
        im = im.convert('RGB')
        w, h = im.size; s = 1400 / max(w, h)
        if s < 1: im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
        out = os.path.join(dst, key + '.jpg')
        im.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
        print(f'{key:16s} {w}x{h} -> {im.size[0]}x{im.size[1]}  {os.path.getsize(out)//1024} KB')
