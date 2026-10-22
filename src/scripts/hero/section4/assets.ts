// Section 4's asset path (docs/specs/section-4.md 5): the baked lightmaps as AVIF with a WebP fallback through
// createImageBitmap (no flip: the UVs are glTF's, origin top left, so the image is used as stored), and the hall's model
// as hall.bin, the compact binary scripts/room/hall-bin.mjs writes from hall.glb, read here by a few typed-array views
// in place of three's GLTFLoader (13.5 KB gzip off the section's script; section-4-world.md 6). Nothing here is a
// texture or a file from the reference.
import { BufferAttribute, BufferGeometry, Group, Mesh, SRGBColorSpace, Texture, type Object3D } from 'three';

export async function loadLightmap(avifUrl: string, webpUrl: string, avif: boolean, what: string): Promise<Texture> {
  const res = await fetch(avif ? avifUrl : webpUrl, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`${what} lightmap: HTTP ${res.status}`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const tex = new Texture(bitmap); tex.flipY = false; tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  return tex;
}

/** one part of hall.bin: its name (hall.py's node name, "fixture" and "spot" merged) and views into the file */
export interface HallPart { name: string; position: Float32Array; normal: Int8Array; uv: Float32Array | null; index: Uint16Array }

/** hall.bin's layout (scripts/room/hall-bin.mjs): a 24-byte head, the parts' ranges, the names, then each attribute in one block */
export function parseHallBin(buf: ArrayBuffer): HallPart[] {
  const [magic, V, , U, P, L] = new Uint32Array(buf, 0, 6), r = new Uint32Array(buf, 24, P * 4);
  if (magic !== 0x314b4853) throw new Error('hall model: not hall.bin');
  const pad = (n: number) => (n + 3) & ~3, head = 24 + P * 16, pos = head + pad(L), uv = pos + V * 12, nrm = uv + U * 8, idx = nrm + pad(V * 3);
  return new TextDecoder().decode(new Uint8Array(buf, head, L)).split(',').map((name, k) => {
    const [v0, vc, i0, ic] = r.subarray(k * 4, k * 4 + 4);
    return { name, position: new Float32Array(buf, pos + v0 * 12, vc * 3), normal: new Int8Array(buf, nrm + v0 * 3, vc * 3), uv: v0 < U ? new Float32Array(buf, uv + v0 * 8, vc * 2) : null, index: new Uint16Array(buf, idx + i0 * 2, ic) };
  });
}

/** the hall: a group of one mesh per part, each named as hall.ts assigns its material */
export async function loadHall(url: string): Promise<Object3D> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`hall model: HTTP ${res.status}`);
  const root = new Group();
  for (const p of parseHallBin(await res.arrayBuffer())) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(p.position, 3)); g.setAttribute('normal', new BufferAttribute(p.normal, 3, true));
    if (p.uv) g.setAttribute('uv', new BufferAttribute(p.uv, 2));
    g.setIndex(new BufferAttribute(p.index, 1));
    const m = new Mesh(g); m.name = p.name; root.add(m);
  }
  return root;
}

/** sRGB to linear, as the shaders encode back */
export const LIGHT_VERT = /* glsl */`
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w; }`;

export const TO_SRGB = /* glsl */`vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }`;
