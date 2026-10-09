// Texture loading (hero-architecture.md 6.3, spec D8). Returns the texture at once, as TextureLoader.load does, and calls
// onLoad when its image is ready; a load error calls onError, which the hero treats as a hard failure (D19).
// Two paths: 'bitmap' decodes off the main thread through ImageBitmapLoader (imageOrientation flipY, premultiplyAlpha
// none; the bitmap is closed once uploaded), 'image' is the prototype's TextureLoader. D8 keeps 'bitmap' only if the
// stage 1 rest frames are identical to the 'image' path (decided in build step 8; config/hero.ts TEXTURE_PATH).
import { ImageBitmapLoader, Texture, TextureLoader } from 'three';

export type TexturePath = 'bitmap' | 'image';

export function loadTexture(url: string, path: TexturePath, onLoad: () => void, onError: (e: unknown) => void): Texture {
  if (path === 'image') return new TextureLoader().load(url, () => onLoad(), undefined, onError);
  const tex = new Texture();
  tex.flipY = false;   // the bitmap is decoded already flipped; WebGL ignores UNPACK_FLIP_Y for ImageBitmap sources
  const loader = new ImageBitmapLoader();
  loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
  loader.load(url, (bmp) => {
    tex.image = bmp;
    let closed = false;
    tex.onUpdate = () => { if (!closed) { closed = true; bmp.close(); } };   // uploaded: the GPU copy is the only one needed
    tex.needsUpdate = true;
    onLoad();
  }, undefined, onError);
  return tex;
}
