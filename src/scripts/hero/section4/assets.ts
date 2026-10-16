// Section 4's asset path (docs/specs/section-4.md 5): the baked lightmaps as AVIF with a WebP fallback through
// createImageBitmap (no flip: the UVs are glTF's, origin top left, so the image is used as stored), and the models through
// GLTFLoader.parse from our own fetch. Nothing here is a texture or a file from the reference.
import { SRGBColorSpace, Texture, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadLightmap(avifUrl: string, webpUrl: string, avif: boolean, what: string): Promise<Texture> {
  const res = await fetch(avif ? avifUrl : webpUrl, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`${what} lightmap: HTTP ${res.status}`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const tex = new Texture(bitmap); tex.flipY = false; tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  return tex;
}

export function loadModel(url: string, what: string): Promise<Object3D> {
  return new Promise((resolve, reject) => {
    fetch(url, { credentials: 'same-origin' }).then(async (res) => {
      if (!res.ok) throw new Error(`${what} model: HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      new GLTFLoader().parse(buf, '', (g) => resolve(g.scene), reject);
    }).catch(reject);
  });
}

/** sRGB to linear, as the shaders encode back */
export const LIGHT_VERT = /* glsl */`
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w; }`;

export const TO_SRGB = /* glsl */`vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }`;
