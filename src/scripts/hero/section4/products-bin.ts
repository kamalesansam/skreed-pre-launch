// Section 4's four products from products.bin (written by scripts/room/products-bin.mjs from the four GLBs; the layout
// is documented there): the wallet, the AirPods case, the Lenskin and the phone case, each as one BufferGeometry per
// part, read by typed-array views in place of three's GLTFLoader and the meshopt decoder, which the director's chunk
// must not carry (tests/unit/hall-bin.test.ts; assets.ts's hall.bin is the precedent). Positions come back as Float32
// metres off each product's u16 grid (offset + scale x q), recentred so the bounding box centre is the origin, Y up as
// the sources; normals as Float32 from the i8 (within 1 percent of unit length); the index is a Uint16Array view
// straight into the file. Nothing here is a texture, a material or a file from the reference.
import { BufferAttribute, BufferGeometry } from 'three';

export interface ProductPart { name: string; geometry: BufferGeometry }
export interface Product { name: string; /** the bounding box in metres, centred on the origin */ size: [number, number, number]; parts: ProductPart[] }

/** products.bin's layout: a 24-byte head, N 36-byte products, P 16-byte parts, the names, then positions, normals and indices in one block each */
export function parseProductsBin(buf: ArrayBuffer): Product[] {
  if (buf.byteLength < 24) throw new Error('products model: truncated');
  const [magic, N, P, V, I, L] = new Uint32Array(buf, 0, 6);
  if (magic !== 0x31504853) throw new Error('products model: not products.bin');
  const pad = (n: number) => Math.ceil(n / 4) * 4, head = 24 + N * 36 + P * 16, pos = head + pad(L), nrm = pos + pad(V * 6), idx = nrm + pad(V * 3);
  // a body cut short (a proxy can resolve res.ok on a partial response) fails here, not as a view's RangeError
  if (buf.byteLength < idx + pad(I * 2)) throw new Error('products model: truncated');
  const pf = new Float32Array(buf, 24, N * 9), pu = new Uint32Array(buf, 24, N * 9), r = new Uint32Array(buf, 24 + N * 36, P * 4);
  const names = new TextDecoder().decode(new Uint8Array(buf, head, L)).split(',');
  return Array.from({ length: N }, (_, k) => {
    const [ox, oy, oz, s, sx, sy, sz] = pf.subarray(k * 9, k * 9 + 7), p0 = pu[k * 9 + 7], pc = pu[k * 9 + 8];
    if (p0 + pc > P) throw new Error('products model: part out of range');
    const parts = Array.from({ length: pc }, (_, j) => {
      const [v0, vc, i0, ic] = r.subarray((p0 + j) * 4, (p0 + j) * 4 + 4);
      if (v0 + vc > V || i0 + ic > I) throw new Error('products model: part out of range');
      const q = new Uint16Array(buf, pos + v0 * 6, vc * 3), n = new Int8Array(buf, nrm + v0 * 3, vc * 3), position = new Float32Array(vc * 3), normal = new Float32Array(vc * 3);
      for (let i = 0; i < vc * 3; i += 3) { position[i] = ox + s * q[i]; position[i + 1] = oy + s * q[i + 1]; position[i + 2] = oz + s * q[i + 2]; }
      for (let i = 0; i < vc * 3; i++) normal[i] = n[i] / 127;
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(position, 3)); g.setAttribute('normal', new BufferAttribute(normal, 3));
      g.setIndex(new BufferAttribute(new Uint16Array(buf, idx + i0 * 2, ic), 1));
      return { name: names[N + p0 + j], geometry: g };
    });
    return { name: names[k], size: [sx, sy, sz] as [number, number, number], parts };
  });
}

/** products.bin fetched with the site's 20 s timeout (model-fetch.ts's pattern), stopped by signal, and parsed */
export async function fetchProductsBin(url: string, signal?: AbortSignal): Promise<Product[]> {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20_000), stop = () => ac.abort();
  if (signal?.aborted) ac.abort();
  signal?.addEventListener('abort', stop, { once: true });
  try {
    const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`products model: HTTP ${res.status}`);
    return parseProductsBin(await res.arrayBuffer());
  } finally { clearTimeout(t); signal?.removeEventListener('abort', stop); }
}
