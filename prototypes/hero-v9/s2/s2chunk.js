// =====================================================================
// Section 2: the ten gems (Gem C, Sam 2026-10-10), from the approved gem page (prototypes/section-2), in its own scope.
// Its own scene and camera render into its own targets; the hero's composite wipes to it and keeps the logo over it.
// =====================================================================
const S2 = (() => {
const LOOK = 'C', MODE = 'field', VCLOCK = false, REDUCE = reduce, TOUCH = matchMedia('(pointer: coarse)').matches;
const nowMs = () => performance.now();
let cssW = 1, cssH = 1, ASP = 1, PHONE = false, LAB_PX = 13, fpx = 1;
const W = () => renderer.domElement.width, H = () => renderer.domElement.height;
const FAM = [['Frosty Whites', 'Snow', '#f0f4f5', 2], ['Blissful Blues', 'Sky', '#08bcf4', 3], ['Playful Pinks', 'Rouge', '#f2638f', 7],
  ['Vivid Violets', 'Amethyst', '#8554d1', 5], ['Mellow Yellows', 'Sunbeam', '#fff164', 6], ['Earthy Browns', 'Cinnamon', '#ba7237', 4],
  ['Blushing Corals', 'Mango', '#ff9f40', 0], ['Stormy Greys', 'Silver', '#acacac', 1], ['Go Green', 'Lawn', '#4aa325', 8], ['Roaring Reds', 'Crimson', '#d20000', 9]];
function rng(seed) { let s = (Math.imul(seed | 0, 2654435761) >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const V3 = THREE.Vector3;
const sRGBtoLin = (h) => new THREE.Color(h);                // Color() stores linear (ColorManagement on)
const linArr = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- geometry: polytope by half-space clipping (gems A to C)
function clipPolys(polys, n, d) {
  const out = [], cap = [];
  for (const poly of polys) {
    const res = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = a.dot(n) - d, db = b.dot(n) - d;
      if (da <= 0) res.push(a);
      if (da * db < 0) { const p = a.clone().lerp(b, da / (da - db)); res.push(p); cap.push(p); }
    }
    if (res.length >= 3) out.push(res);
  }
  if (cap.length >= 3) {
    const c = new V3(); cap.forEach((p) => c.add(p)); c.divideScalar(cap.length);
    const u = new V3().crossVectors(n, Math.abs(n.y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0)).normalize();
    const v = new V3().crossVectors(n, u);
    const uniq = [];
    for (const p of cap) if (!uniq.some((o) => o.distanceToSquared(p) < 1e-12)) uniq.push(p);
    uniq.sort((a, b) => Math.atan2(a.clone().sub(c).dot(v), a.clone().sub(c).dot(u)) - Math.atan2(b.clone().sub(c).dot(v), b.clone().sub(c).dot(u)));
    if (uniq.length >= 3) out.push(uniq);
  }
  return out;
}
function boxPolys(s) {
  const P = (x, y, z) => new V3(x * s, y * s, z * s);
  return [[P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)],
    [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)], [P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)],
    [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]];
}
function polyNormal(p) {
  const n = new V3();
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y); }
  return n.normalize();
}
function orient(g) {        // make the winding outward (positive signed volume) so FrontSide and BackSide mean what they say
  const p = g.attributes.position.array; let vol = 0;
  if (g.index) { const I = g.index.array, v = (k, c) => p[I[k] * 3 + c];
    for (let t = 0; t < I.length; t += 3) vol += (v(t, 0) * (v(t + 1, 1) * v(t + 2, 2) - v(t + 1, 2) * v(t + 2, 1)) - v(t, 1) * (v(t + 1, 0) * v(t + 2, 2) - v(t + 1, 2) * v(t + 2, 0)) + v(t, 2) * (v(t + 1, 0) * v(t + 2, 1) - v(t + 1, 1) * v(t + 2, 0))) / 6;
    if (vol < 0) { for (let t = 0; t < I.length; t += 3) { const a = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = a; } g.index.needsUpdate = true; g.computeVertexNormals(); }
    g.userData.flipped = vol < 0; return g; }
  for (let t = 0; t < p.length; t += 9) vol += (p[t] * (p[t + 4] * p[t + 8] - p[t + 5] * p[t + 7]) - p[t + 1] * (p[t + 3] * p[t + 8] - p[t + 5] * p[t + 6]) + p[t + 2] * (p[t + 3] * p[t + 7] - p[t + 4] * p[t + 6])) / 6;
  if (vol < 0) { for (let t = 0; t < p.length; t += 9) for (let c = 0; c < 3; c++) { const a = p[t + 3 + c]; p[t + 3 + c] = p[t + 6 + c]; p[t + 6 + c] = a; }
    const cr = g.attributes.aCrush; if (cr) { const a = cr.array; for (let t = 0; t < a.length; t += 3) { const x = a[t + 1]; a[t + 1] = a[t + 2]; a[t + 2] = x; } }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }
  g.userData.flipped = vol < 0; return g;
}
const LONG = 2.4;   // every stone's longest bounding-box side, world units (igloo's stones are 2.40 to 2.46 tall)
function gemGeometry(seed) {
  const r = rng(seed * 7 + 3);
  const ax = [0.60 + 0.24 * r(), 1.0, 0.50 + 0.22 * r()];                 // tall, flattened front to back, each different
  const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.6, (r() - 0.5) * 0.9, (r() - 0.5) * 0.6));
  const tqi = tq.clone().invert();
  let polys = boxPolys(3);
  const planes = [[new V3(1, 0, 0), 3], [new V3(-1, 0, 0), 3], [new V3(0, 1, 0), 3], [new V3(0, -1, 0), 3], [new V3(0, 0, 1), 3], [new V3(0, 0, -1), 3]];
  const K = 22 + Math.floor(r() * 9);
  for (let k = 0; k < K; k++) {
    const t = (k + 0.5) / K, inc = Math.acos(1 - 2 * t), az = Math.PI * (1 + Math.sqrt(5)) * k + r() * 0.6;
    const n = new V3(Math.sin(inc) * Math.cos(az), Math.cos(inc), Math.sin(inc) * Math.sin(az));
    n.x += (r() - 0.5) * 0.5; n.y += (r() - 0.5) * 0.5; n.z += (r() - 0.5) * 0.5; n.normalize();
    const nl = n.clone().applyQuaternion(tqi);
    const h = Math.hypot(ax[0] * nl.x, ax[1] * nl.y, ax[2] * nl.z);
    let d = h * (0.84 + 0.16 * r()); if (r() < 0.2) d *= 0.8;               // a few deep cleaves: the deformation
    polys = clipPolys(polys, n, d); planes.push([n, d]);
  }
  // slight bevels: one narrow facet along every edge sharper than 20 deg
  const key = (p) => `${Math.round(p.x * 1e4)},${Math.round(p.y * 1e4)},${Math.round(p.z * 1e4)}`;
  const edges = new Map(); const norms = polys.map(polyNormal);
  polys.forEach((p, i) => { for (let k = 0; k < p.length; k++) { const a = key(p[k]), b = key(p[(k + 1) % p.length]); const e = a < b ? a + '|' + b : b + '|' + a; if (!edges.has(e)) edges.set(e, []); edges.get(e).push(i); } });
  const allV = polys.flat();
  const bevel = [];
  for (const [, f] of edges) {
    if (f.length !== 2) continue;
    const n1 = norms[f[0]], n2 = norms[f[1]]; if (n1.dot(n2) > Math.cos(THREE.MathUtils.degToRad(20))) continue;
    const nb = n1.clone().add(n2).normalize(); let hb = -1e9; for (const v of allV) hb = Math.max(hb, v.dot(nb));
    bevel.push([nb, hb - 0.012]);
  }
  for (const [n, d] of bevel) polys = clipPolys(polys, n, d);
  // centre and scale to LONG
  const bb = new THREE.Box3(); polys.forEach((p) => p.forEach((v) => bb.expandByPoint(v)));
  const C = bb.getCenter(new V3()), sz = bb.getSize(new V3()), S = LONG / Math.max(sz.x, sz.y, sz.z);
  const pos = [];
  for (const p of polys) {
    const n = polyNormal(p), pc = new V3(); p.forEach((v) => pc.add(v)); pc.divideScalar(p.length);
    const ring = n.dot(pc.clone().sub(C)) < 0 ? [...p].reverse() : p;
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length];
      for (const v of [pc, a, b]) pos.push((v.x - C.x) * S, (v.y - C.y) * S, (v.z - C.z) * S); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  // the main cut planes in the final frame (for look C's internal trace); bevels are thin and left out
  g.userData.planes = planes.map(([n, d]) => [n.x, n.y, n.z, S * (d - n.dot(C))]).filter((p) => p[3] < 3 * S);
  g.userData.facets = polys.length;
  return orient(g);
}
// ---------------------------------------------------------------- environments (procedural, no files)
function equirect(Wd, Hd, fn) {
  const data = new Uint16Array(Wd * Hd * 4); const toH = THREE.DataUtils.toHalfFloat;
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
    const c = fn(x, y, Wd, Hd), o = (y * Wd + x) * 4; data[o] = toH(c[0]); data[o + 1] = toH(c[1]); data[o + 2] = toH(c[2]); data[o + 3] = toH(1);
  }
  const t = new THREE.DataTexture(data, Wd, Hd, THREE.RGBAFormat, THREE.HalfFloatType);
  t.mapping = THREE.EquirectangularReflectionMapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
// D: overcast sky over a frozen lake, hazy sun at lon -11.5, lat 28.7 with 10.45 percent of the energy (fit in data/env-fit.json)
function studioFn(x, y, Wd, Hd) {
  const lon = ((x + 0.5) / Wd - 0.5) * 2 * Math.PI, lat = ((y + 0.5) / Hd - 0.5) * Math.PI;
  const d = new V3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
  let c = d.y > 0 ? 0.30 + 0.30 * Math.pow(d.y, 0.6) : 0.30 - 0.27 * Math.pow(-d.y, 0.45);
  const box = (axis, sw, sh, e) => {
    const a = axis.clone().normalize(), z = d.dot(a); if (z <= 0) return 0;
    const u = new V3().crossVectors(a, new V3(0, 1, 0.001)).normalize(), v = new V3().crossVectors(u, a);
    const px = d.dot(u) / z, py = d.dot(v) / z;
    return e * (1 - smooth(sw * 0.9, sw, Math.abs(px))) * (1 - smooth(sh * 0.9, sh, Math.abs(py)));
  };
  c += box(new V3(-0.55, 0.62, 0.70), 0.32, 0.16, 16);
  c += box(new V3(0.80, 0.18, 0.55), 0.06, 0.40, 9);
  c += box(new V3(0.10, 0.95, 0.20), 0.25, 0.25, 6);
  c += box(new V3(0.25, 0.35, -0.90), 0.45, 0.10, 4);
  const pins = [[-0.2, 0.75, 0.62], [0.55, 0.55, 0.62], [-0.75, 0.30, 0.58], [0.30, 0.85, -0.42], [-0.45, 0.20, -0.87], [0.85, 0.45, -0.25]];
  for (const p of pins) { const a = new V3(...p).normalize(); const th = Math.acos(Math.min(1, d.dot(a))); c += 60 * Math.exp(-th * th / (2 * 0.009 * 0.009)); }
  return [c * 0.96, c * 0.99, c * 1.04];
}

// ---------------------------------------------------------------- GLSL shared
const GLSL_NOISE = /* glsl */`
  vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn3(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
  vec4 cell3(vec3 p) { vec3 i = floor(p), f = fract(p); float d1 = 9.0; vec3 id = i;
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 g = vec3(x, y, z); vec3 r = g + h33(i + g) - f; float d = dot(r, r); if (d < d1) { d1 = d; id = i + g; } }
    return vec4(h33(id + 3.7), sqrt(d1)); }
  vec3 encSRGB(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
  vec3 decSRGB(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  // Khronos PBR Neutral tone curve (published formula), written out
  vec3 neutralTone(vec3 c) { float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
    float pk = max(c.r, max(c.g, c.b)); if (pk < 0.76) return c; float d = 0.24; float np = 1.0 - d * d / (pk + d - 0.76);
    c *= np / pk; float g = 1.0 - 1.0 / (0.15 * (pk - np) + 1.0); return mix(c, vec3(np), g); }
`;
// ---------------------------------------------------------------- background (the background area's recipe, in our code)
function fogNoise64(seed = 249) {
  const AMP = { 1: 0.01499, 1.414: 0.02238, 2: 0.02556, 2.236: 0.02357, 2.828: 0.02694, 3: 0.01788, 3.162: 0.02118, 3.606: 0.00736, 4: 0.00495, 4.123: 0.00612, 4.243: 0.00562, 4.472: 0.00355 };
  let s = seed >>> 0; const rnd = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  const modes = [];
  for (let ky = 0; ky <= 4; ky++) for (let kx = -4; kx <= 4; kx++) { if (ky === 0 && kx <= 0) continue; const r = Math.round(Math.hypot(kx, ky) * 1000) / 1000; if (!(r in AMP)) continue; modes.push([kx, ky, 2 * AMP[r], rnd() * 2 * Math.PI]); }
  const f = new Float64Array(4096);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { let v = 0; for (const [kx, ky, a, ph] of modes) v += a * Math.cos(2 * Math.PI * (kx * x + ky * y) / 64 + ph); f[y * 64 + x] = v; }
  let m = 0; for (const v of f) m += v; m /= 4096; let q = 0; for (const v of f) q += (v - m) ** 2; const sd = Math.sqrt(q / 4096);
  const out = new Uint8Array(4096); for (let i = 0; i < 4096; i++) out[i] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + (f[i] - m) * (0.1373 / sd))))); return out;
}
function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296); }
function gemAtlas() {
  const C = 256, cv = document.createElement('canvas'); cv.width = C * 3; cv.height = C; const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  [{ seed: 11, blur: 2.5, n: 7 }, { seed: 29, blur: 2.5, n: 9 }, { seed: 47, blur: 10, n: 8 }].forEach((cell, ci) => {
    const r = lcg(cell.seed), n = cell.n, pts = []; const tw = 0.55 + 0.1 * r(), ch = 0.35 + 0.1 * r(), pd = 0.75 + 0.2 * r();
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.2 * (r() - 0.5); pts.push([tw * Math.cos(a), ch, tw * Math.sin(a)]); }
    for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI * 2 + 0.2 * (r() - 0.5); const k = 0.9 + 0.2 * r(); pts.push([k * Math.cos(a), 0, k * Math.sin(a)]); }
    pts.push([0.05 * (r() - 0.5), -pd, 0.05 * (r() - 0.5)]);
    const edges = []; for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n], [n + i, n + (i + 1) % n], [i, n + i], [(i + 1) % n, n + i], [n + i, 2 * n]);
    for (let i = 0; i < n; i += 2) edges.push([i, (i + Math.floor(n / 2)) % n]);
    const ax = 0.5 + 0.6 * r(), ay = r() * 6.28, az = 0.3 * (r() - 0.5);
    const rot = ([x, y, z]) => { let c = Math.cos(ay), s = Math.sin(ay); [x, z] = [c * x + s * z, -s * x + c * z]; c = Math.cos(ax); s = Math.sin(ax); [y, z] = [c * y - s * z, s * y + c * z]; c = Math.cos(az); s = Math.sin(az); [x, y] = [c * x - s * y, s * x + c * y]; return [x, y]; };
    const P = pts.map(rot).map(([x, y]) => [ci * C + C / 2 + x * C * 0.36, C / 2 - y * C * 0.36]);
    g.save(); g.beginPath(); g.rect(ci * C, 0, C, C); g.clip(); g.filter = `blur(${cell.blur}px)`; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); for (const [a, b] of edges) { g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 4; i++) { const p = P[Math.floor(r() * P.length)]; g.beginPath(); g.arc(p[0] + 14 * (r() - 0.5), p[1] + 14 * (r() - 0.5), 3, 0, 6.283); g.fill(); }
    g.restore();
  });
  return cv;
}
const SHAPES = [[-4.7, 4.6, -3.1, 1.15, 0.74, 0], [-1.6, 1.9, -3.7, 1.40, 0.21, 1], [1.9, 6.4, -2.9, 0.85, 0.57, 2], [2.6, -0.4, -6.9, 1.20, 0.33, 0], [4.4, 3.4, -4.4, 1.05, 0.88, 2], [-3.2, -5.6, -5.2, 1.10, 0.46, 1]];
const bgUniforms = {
  uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uScroll: { value: 2.15 }, uFrame: { value: 0 }, uPre: { value: 0 },
  tNoise: { value: null }, tShapes: { value: null }, uS: { value: new Float32Array(24) }, uSB: { value: new Float32Array(24) },
  uLab: { value: new Float32Array(120) }, uLabA: { value: new Float32Array(30) }, uLabN: { value: 0 }, uLabFeather: { value: 10 },
};
{
  const nt = new THREE.DataTexture(fogNoise64(249), 64, 64, THREE.RedFormat, THREE.UnsignedByteType);
  nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.magFilter = nt.minFilter = THREE.LinearFilter; nt.needsUpdate = true; bgUniforms.tNoise.value = nt;
  const st = new THREE.CanvasTexture(gemAtlas()); st.flipY = false; st.minFilter = st.magFilter = THREE.LinearFilter; st.generateMipmaps = false; st.colorSpace = THREE.NoColorSpace; bgUniforms.tShapes.value = st;
}
const FS_VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const bgMaterial = new THREE.ShaderMaterial({
  uniforms: bgUniforms, depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  fragmentShader: /* glsl */`
  precision highp float;
  uniform vec2 uRes; uniform float uTime, uScroll, uFrame, uPre, uLabN, uLabFeather; uniform sampler2D tNoise, tShapes;
  uniform vec4 uS[6]; uniform vec4 uSB[6]; uniform vec4 uLab[30]; uniform float uLabA[30];
  const vec3 R[21] = vec3[21](vec3(237,239,244), vec3(230,232,241), vec3(223,226,238), vec3(216,219,231), vec3(208,212,223), vec3(201,205,216), vec3(193,197,209),
    vec3(184,189,201), vec3(175,181,192), vec3(166,171,184), vec3(157,161,175), vec3(147,152,165), vec3(136,142,154), vec3(122,128,140),
    vec3(107,113,126), vec3(97,103,116), vec3(86,92,105), vec3(76,81,94), vec3(63,68,81), vec3(51,57,69), vec3(35,41,54));
  vec3 lin(vec3 c) { c /= 255.0; return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 enc(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
  vec3 dec(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 ramp(float p) { float x = clamp(p, 0.0, 1.0) * 20.0; int i = min(int(x), 19); return mix(lin(R[i]), lin(R[i + 1]), x - float(i)); }
  uint hu(uvec3 v) { v = v * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return v.x ^ v.y ^ v.z; }
  float h1(vec2 c, float s) { return float(hu(uvec3(ivec3(int(floor(c.x)) + 4096, int(floor(c.y)) + 4096, int(s)))) & 0xffffffu) / 16777216.0; }
  void main() {
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;
    vec2 s = vec2(uv.x * asp, uv.y) * 0.3; float t = uTime * 0.075;
    float p = 0.5 * (texture(tNoise, s + vec2(-t, 0.25 * t - 0.1625 * uScroll)).r + texture(tNoise, s * 0.5 + vec2(t, -0.5 * t)).r);
    // final on-screen ramp (grade and bloom folded in), or the pre-grade fog that igloo's stones refract (look D's pass A)
    vec3 col = uPre > 0.5 ? mix(lin(vec3(201.0, 208.0, 223.0)), lin(vec3(84.0, 91.0, 107.0)), p) : ramp(p);
    vec2 du = vec2(uv.x * asp, uv.y) * 13.5 + vec2(0.0, -2.5 * uScroll); vec2 cell = floor(du), f = fract(du);
    vec2 at = 0.12 + 0.76 * vec2(h1(cell, 7.0), h1(cell, 13.0));                     // jittered dots (rule 43)
    float cpx = uRes.y / 13.5, tx = cpx / 64.0, txe = max(tx, 1.0); vec2 d = abs(f - at) * cpx;
    float tent = max(0.0, 1.0 - d.x / txe) * max(0.0, 1.0 - d.y / txe) * (tx * tx) / (txe * txe);
    float tw = 1.0 - abs(fract(h1(cell, 3.0) + uTime * 0.1) - 0.5) * 2.0;
    col += 0.5 * (tx * tx / 0.857) * tent * tw;
    for (int i = 0; i < 6; i++) {
      vec2 q = px - uS[i].xy; float c = cos(uS[i].w), sn = sin(uS[i].w); q = mat2(c, sn, -sn, c) * q / (2.0 * uS[i].z) + 0.5;
      if (any(lessThan(q, vec2(0.0))) || any(greaterThan(q, vec2(1.0)))) continue;
      float a = texture(tShapes, vec2((uSB[i].x + q.x) / 3.0, q.y)).r; vec2 w = uSB[i].zw + (q - 0.5) * 2.4;
      float idle = (sin((w.x + w.y) * 5.0 + uTime * 3.0) * 0.5 + 0.5) * (cos(w.y * 10.0 + a * 3.0 + uTime * 2.0) * 0.5 + 0.5) * (sin(w.y * 2.0 + uTime * 2.0) * 0.5 + 0.5);
      col += uSB[i].y * a * (0.1 + 0.9 * idle);
    }
    vec3 srgb = enc(col);
    // label plates: the fog under each label darkened to luma 113 or less (Pearl Whisper text then holds 4.5:1), feathered
    if (uPre < 0.5) { float m = 0.0;
      for (int i = 0; i < 30; i++) { if (float(i) >= uLabN) break; vec4 r = uLab[i];
        vec2 dd = max(r.xy - px, px - r.zw); float e = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0); m = max(m, uLabA[i] * (1.0 - smoothstep(0.0, uLabFeather, e))); }
      float Y = dot(srgb, vec3(0.2126, 0.7152, 0.0722)), T = 113.0 / 255.0; if (Y > T) srgb *= mix(1.0, T / Y, m); }
    vec2 g = gl_FragCoord.xy; float fr = uFrame;
    srgb += ((h1(g, fr * 4.0) - 0.5) * 4.0 + (vec3(h1(g, fr * 4.0 + 1.0), h1(g, fr * 4.0 + 2.0), h1(g, fr * 4.0 + 3.0)) - 0.5) * 2.7) / 255.0;
    gl_FragColor = vec4(dec(srgb), 0.0);      // alpha 0: background, never blooms
  }`,
});
function bgLayout(time) {
  const Wd = W(), Hd = H(), asp = Wd / Hd, zoom = Math.min(1, 1.25 * asp), th = Math.tan(Math.PI / 8), scroll = bgUniforms.uScroll.value;
  const S = bgUniforms.uS.value, SB = bgUniforms.uSB.value;
  SHAPES.forEach(([x, y, z, rad, rnd, cell], i) => {
    const X = x * Math.min(1, Math.max(0.65, asp * 0.5)), Y = y - 2.5 + 2.5 * scroll, zv = z - 5;
    const ndcX = X / (-zv * th * asp) * zoom, ndcY = Y / (-zv * th) * zoom;
    S.set([(ndcX * 0.5 + 0.5) * Wd, (0.5 - ndcY * 0.5) * Hd, rad / (-zv * th) * zoom * 0.5 * Hd, 0.2 * rnd * time + 1.25 * scroll * (0.1 + 0.4 * rnd)], i * 4);
    SB.set([cell, 0.27 * 0.65, x, y], i * 4);
  });
}

// ---------------------------------------------------------------- render targets and full-screen passes
const fsGeo = new THREE.BufferGeometry(); fsGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function fsMesh(mat) { const m = new THREE.Mesh(fsGeo, mat); m.frustumCulled = false; return m; }
function fsScene(mat) { const s = new THREE.Scene(); s.add(fsMesh(mat)); return s; }
const RT = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, ...o });
let rtMain, rtBG, rtOut, bloomRTs = [];
function makeTargets() {
  const w = W(), h = H();
  for (const t of [rtMain, rtBG, rtOut]) if (t) t.dispose(); for (const b of bloomRTs) { b.down.dispose(); b.up.dispose(); }
  rtMain = RT(w, h, { samples: 4 });
  rtOut = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false });     // sRGB-encoded colour, alpha = what the gems and flights cover
  rtBG = RT(w, h, { minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true, depthBuffer: false });
  bloomRTs = []; let bw = Math.max(1, w >> 1), bh = Math.max(1, h >> 1);
  for (let i = 0; i < 6; i++) { bloomRTs.push({ down: RT(bw, bh, { depthBuffer: false }), up: RT(bw, bh, { depthBuffer: false }) }); bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); }
}

// bloom (our own): prefilter (stones only, alpha = 1), 4-tap box down chain, tent up chain mixed by radius
const bloomPre = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: 0.2 }, uKnee: { value: 0.025 } },
  fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr, uKnee;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec4 a = texture(tSrc, uv); vec3 c = a.rgb * a.a;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); gl_FragColor = vec4(c * smoothstep(uThr - uKnee, uThr + uKnee, l), 1.0); }` });
const bloomDown = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uSrcTexel: { value: new THREE.Vector2() } },
  fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel, uSrcTexel;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec2 o = uSrcTexel;
      vec3 c = texture(tSrc, uv + vec2(-o.x, -o.y)).rgb + texture(tSrc, uv + vec2(o.x, -o.y)).rgb + texture(tSrc, uv + vec2(-o.x, o.y)).rgb + texture(tSrc, uv + vec2(o.x, o.y)).rgb;
      c = 0.5 * c / 4.0 + 0.5 * texture(tSrc, uv).rgb; gl_FragColor = vec4(c, 1.0); }` });
const bloomUp = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  uniforms: { tSmall: { value: null }, tSupport: { value: null }, uTexel: { value: new THREE.Vector2() }, uSmallTexel: { value: new THREE.Vector2() }, uRadius: { value: 0.85 } },
  fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSmall, tSupport; uniform vec2 uTexel, uSmallTexel; uniform float uRadius;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec2 o = uSmallTexel;
      vec3 c = texture(tSmall, uv).rgb * 4.0;
      c += (texture(tSmall, uv + vec2(o.x, 0)).rgb + texture(tSmall, uv - vec2(o.x, 0)).rgb + texture(tSmall, uv + vec2(0, o.y)).rgb + texture(tSmall, uv - vec2(0, o.y)).rgb) * 2.0;
      c += texture(tSmall, uv + o).rgb + texture(tSmall, uv - o).rgb + texture(tSmall, uv + vec2(o.x, -o.y)).rgb + texture(tSmall, uv + vec2(-o.x, o.y)).rgb;
      c /= 16.0; gl_FragColor = vec4(mix(texture(tSupport, uv).rgb, c, uRadius), 1.0); }` });
const composite = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  uniforms: { tMain: { value: null }, tBloom: { value: null }, uTexel: { value: new THREE.Vector2() }, uIntensity: { value: 1 }, uScreen: { value: 1 }, uMask: { value: 0 } },
  fragmentShader: /* glsl */`precision highp float; uniform sampler2D tMain, tBloom; uniform vec2 uTexel; uniform float uIntensity, uScreen, uMask;
    vec3 enc(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec3 a = texture(tMain, uv).rgb; vec3 b = texture(tBloom, uv).rgb * uIntensity;
      vec3 c = uScreen > 0.5 ? a + b - a * b : a + b; if (uMask > 0.5) c = vec3(texture(tMain, uv).a); gl_FragColor = vec4(enc(c), clamp(texture(tMain, uv).a, 0.0, 1.0)); }` });
const S_pre = fsScene(bloomPre), S_down = fsScene(bloomDown), S_up = fsScene(bloomUp), S_comp = fsScene(composite);
const BLOOM = { D: { thr: 0.2, knee: 0.025, radius: 0.85, intensity: 1, screen: 1 }, A: { thr: 0.9, knee: 0.25, radius: 0.7, intensity: 0.55, screen: 0 },
  B: { thr: 0.9, knee: 0.25, radius: 0.7, intensity: 0.55, screen: 0 }, C: { thr: 0.75, knee: 0.25, radius: 0.75, intensity: 0.7, screen: 0 } }[LOOK];
function runBloomAndComposite() {
  const w = W(), h = H(), b0 = bloomRTs[0].down;
  bloomPre.uniforms.tSrc.value = rtMain.texture; bloomPre.uniforms.uTexel.value.set(1 / b0.width, 1 / b0.height);
  bloomPre.uniforms.uThr.value = BLOOM.thr; bloomPre.uniforms.uKnee.value = BLOOM.knee;
  renderer.setRenderTarget(b0); renderer.render(S_pre, fsCam);
  for (let i = 1; i < bloomRTs.length; i++) { const src = bloomRTs[i - 1].down, dst = bloomRTs[i].down;
    bloomDown.uniforms.tSrc.value = src.texture; bloomDown.uniforms.uTexel.value.set(1 / dst.width, 1 / dst.height); bloomDown.uniforms.uSrcTexel.value.set(1 / src.width, 1 / src.height);
    renderer.setRenderTarget(dst); renderer.render(S_down, fsCam); }
  let small = bloomRTs[bloomRTs.length - 1].down;
  for (let i = bloomRTs.length - 2; i >= 0; i--) { const dst = bloomRTs[i].up;
    bloomUp.uniforms.tSmall.value = small.texture; bloomUp.uniforms.tSupport.value = bloomRTs[i].down.texture; bloomUp.uniforms.uRadius.value = BLOOM.radius;
    bloomUp.uniforms.uTexel.value.set(1 / dst.width, 1 / dst.height); bloomUp.uniforms.uSmallTexel.value.set(1 / small.width, 1 / small.height);
    renderer.setRenderTarget(dst); renderer.render(S_up, fsCam); small = dst; }
  composite.uniforms.tMain.value = rtMain.texture; composite.uniforms.uMask.value = 0; composite.uniforms.tBloom.value = small.texture; composite.uniforms.uTexel.value.set(1 / w, 1 / h);
  composite.uniforms.uIntensity.value = BLOOM.intensity; composite.uniforms.uScreen.value = BLOOM.screen;
  renderer.setRenderTarget(rtOut); renderer.render(S_comp, fsCam);
}

// ---------------------------------------------------------------- scene, camera, layout
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
const bgMesh = fsMesh(bgMaterial); bgMesh.renderOrder = -100; scene.add(bgMesh);
function slots() {
  const out = [];
  if (MODE === 'close') { out.push({ u: 0.5, v: 0.5, s: 0.62 * cssH, side: 'none' }); return out; }
  if (!PHONE) {
    const p = Math.min(cssW / 5.6, 0.33 * cssH);
    for (let j = 0; j < 10; j++) { const row = j < 5 ? 0 : 1, k = j % 5;
      const x = cssW / 2 + (k - 2.25 + 0.5 * row) * p, y = cssH / 2 + (row ? 1 : -1) * 0.433 * p;
      let side = row ? 'dr' : 'ur'; if (x + 0.6 * p > cssW - 16) side = row ? 'ul' : 'dl';
      out.push({ u: x / cssW, v: y / cssH, s: 0.65 * p, side }); }
  } else {
    const p = Math.min(0.169 * cssH, (cssW - 32) / 1.446);
    for (let j = 0; j < 10; j++) { const x = cssW / 2 + (j % 2 ? 1 : -1) * 0.433 * p, y = cssH / 2 + (j - 4.5) * p / 2;
      out.push({ u: x / cssW, v: y / cssH, s: 0.58 * p, side: j % 2 ? 'l' : 'r' }); }
  }
  return out;
}

const pmrem = new THREE.PMREMGenerator(renderer);
let envTex = null;
const ENV_D_ROT = new THREE.Euler(0, Math.PI, 0);

// patch helper: add our uniforms and code to a MeshPhysicalMaterial
function patch(mat, U, { vert = '', vmain = '', pars = '', replace = {} } = {}) {
  mat.userData.U = U;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec3 vObj; varying vec3 vWPos;\n' + vert)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vObj = position; vWPos = (modelMatrix * vec4(position, 1.0)).xyz;\n' + vmain);
    let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\n varying vec3 vObj; varying vec3 vWPos;\n uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat3 normalMatrix;\n' + GLSL_NOISE + pars);
    for (const [k, v] of Object.entries(replace)) fs = fs.replace(k, v);
    sh.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => LOOK + (mat.side === THREE.BackSide ? 'b' : 'f') + (mat.userData.kind || '');
  return mat;
}
const REFRACT_PARS = /* glsl */`
  uniform sampler2D tTrans; uniform sampler2D tBlue; uniform vec2 uRes; uniform float uFrame; uniform vec3 uFlat; uniform float uUseFlat;
  uniform float uIor, uTh0, uTh1, uSplitG, uSplitB, uJitter, uLodK; uniform vec3 uAbsorb; uniform float uAbsorbK;
  vec2 projUV(vec3 w) { vec4 c = projectionMatrix * viewMatrix * vec4(w, 1.0); return c.xy / c.w * 0.5 + 0.5; }
  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  vec3 modelScale() { return vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)); }
`;
function matC(shadeHex, planes) {
  const sh = new THREE.Color(shadeHex);
  const ab = new THREE.Vector3(-Math.log(Math.max(sh.r, 0.03)), -Math.log(Math.max(sh.g, 0.03)), -Math.log(Math.max(sh.b, 0.03)));
  const P = new Float32Array(32 * 4); planes.slice(0, 32).forEach((p, i) => P.set(p, i * 4));
  const glow = new THREE.Vector3(sh.r, sh.g, sh.b).multiplyScalar(1.0 / Math.max(0.35, Math.pow(Math.max(sh.r, sh.g, sh.b), 0.5)));
  const U = { tBG: { value: null }, uRes: { value: new THREE.Vector2() }, uIor: { value: 1.70 }, uPlanes: { value: P }, uNP: { value: Math.min(32, planes.length) },
    uAbsorb: { value: ab }, uAbsorbK: { value: 0.45 }, uGlow: { value: glow }, uCore: { value: 1.5 }, uCoreR: { value: 0.32 },
    tFrost: { value: blackTex }, uFrostOn: { value: 0 }, uFrostGain: { value: 2.5 }, tLat: { value: latTex }, uLatN: { value: 6 }, uRest: { value: new THREE.Matrix3() },
    uRim: { value: new THREE.Vector3(...linArr('#83a1c5')) }, uFrostScale: { value: FSCALE } };
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, ior: 1.70, specularIntensity: 1, transmission: 0,
    clearcoat: 0.0, envMap: envTex, envMapIntensity: 1.0, side: THREE.FrontSide, flatShading: true });
  m.userData.kind = 'C';
  const MAIN = /* glsl */`
    vec3 nW = inverseTransformDirection(normal, viewMatrix); vec3 vW = normalize(cameraPosition - vWPos);
    mat3 Rm = mat3(normalize(modelMatrix[0].xyz), normalize(modelMatrix[1].xyz), normalize(modelMatrix[2].xyz)); float sc = length(modelMatrix[0].xyz);
    vec3 rW = refract(-vW, nW, 1.0 / uIor); vec3 r = transpose(Rm) * rW; vec3 o = vObj;
    // bounce 1: where the ray leaves the convex stone (nearest plane ahead)
    float t1 = 1e3; vec3 n1 = vec3(0, 1, 0);
    for (int i = 0; i < 32; i++) { if (float(i) >= uNP) break; vec4 p = uPlanes[i]; float dn = dot(r, p.xyz); if (dn <= 1e-4) continue;
      float t = (p.w - dot(o, p.xyz)) / dn; if (t > 1e-4 && t < t1) { t1 = t; n1 = p.xyz; } }
    vec3 p1 = o + r * t1; vec3 col = vec3(0.0);
    vec3 outR = refract(r, -n1, uIor * 0.985), outG = refract(r, -n1, uIor), outB = refract(r, -n1, uIor * 1.03);
    vec3 r2 = reflect(r, -n1);
    float t2 = 1e3; vec3 n2 = vec3(0, 1, 0);
    for (int i = 0; i < 32; i++) { if (float(i) >= uNP) break; vec4 p = uPlanes[i]; float dn = dot(r2, p.xyz); if (dn <= 1e-4) continue;
      float t = (p.w - dot(p1, p.xyz)) / dn; if (t > 1e-4 && t < t2) { t2 = t; n2 = p.xyz; } }
    vec3 out2 = refract(r2, -n2, uIor); if (dot(out2, out2) < 1e-5) out2 = reflect(r2, -n2);
    vec3 bounce2 = textureCubeUV(envMap, envMapRotation * (Rm * normalize(out2)), 0.03).rgb * envMapIntensity * exp(-uAbsorb * uAbsorbK * (t1 + t2) * sc);
    if (dot(outG, outG) < 1e-5) { col = bounce2; }
    else {
      float c = clamp(dot(r, n1), 0.0, 1.0); float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0); float Fs = f0 + (1.0 - f0) * pow(1.0 - c, 5.0);
      vec3 pw = vWPos + Rm * (p1 - o) * sc;
      vec3 bg = vec3(texture(tBG, projUV(pw + Rm * normalize(outR) * 1.6)).r, texture(tBG, projUV(pw + Rm * normalize(outG) * 1.6)).g, texture(tBG, projUV(pw + Rm * normalize(outB) * 1.6)).b);
      col = (1.0 - Fs) * bg * exp(-uAbsorb * uAbsorbK * t1 * sc) + Fs * bounce2; }
    // luminous core: a soft emitter at the centre, integrated along the first segment of the ray
    float tc = clamp(dot(-o, r), 0.0, t1); vec3 pc = o + r * tc; float d2 = dot(pc, pc) / (uCoreR * uCoreR * 1.44 * 1.44);
    col += uGlow * uCore * exp(-d2 * 1.8) * min(1.0, t1 / 1.2);
    vec3 Fr = EnvironmentBRDF(nW, vW, material.specularColor, material.specularF90, material.roughness);
    totalDiffuse = (1.0 - Fr) * col;
    // hover: igloo's frost, emissive = rim x rim colour + lattice x rim x 10 + lattice x frost^2; x2.5 because igloo blooms
    // its whole scene from a 0.2 threshold and Gem C blooms from 0.75, so the crackle reads as bright as igloo's
    if (uFrostOn > 0.5) { vec2 fuv = (uRest * vObj).xy / uFrostScale + 0.5; vec2 fg = texture(tFrost, fuv).rg; float lat = texture(tLat, fuv * uLatN).r;
      totalEmissiveRadiance += uFrostGain * (fg.y * uRim + lat * fg.y * 10.0 + lat * fg.x * fg.x); }
  `;
  return patch(m, U, {
    pars: 'uniform sampler2D tBG; uniform vec2 uRes; uniform float uIor, uNP, uAbsorbK, uCore, uCoreR; uniform vec4 uPlanes[32]; uniform vec3 uAbsorb, uGlow;\n' +
      'uniform sampler2D tFrost, tLat; uniform float uFrostOn, uFrostGain, uLatN, uFrostScale; uniform mat3 uRest; uniform vec3 uRim;\n' +
      'vec2 projUV(vec3 w) { vec4 c = projectionMatrix * viewMatrix * vec4(w, 1.0); return c.xy / c.w * 0.5 + 0.5; }',
    replace: { '#include <transmission_fragment>': MAIN, '#include <opaque_fragment>': 'gl_FragColor = vec4(neutralTone(max(outgoingLight, 0.0)), 1.0);' },
  });
}
const stones = [];
const KW = [42.987, 12.423, 2.53];
const NOISE_W = [0.1234, 0.4221, -0.1375, -0.04566, -0.1450, -0.2123];
const BY = [1.123, 0.816, 4.134, 0.646, 2.856, 3.490], BP = [3.106, 1.580, 0.048, 6.167, 3.416, 5.394], BR = [2.470, 0.762, 5.662, 3.994, 4.968, 5.251];
const n6 = (t, b) => { let s = 0; for (let i = 0; i < 6; i++) s += Math.sin(NOISE_W[i] * t + b[i]); return s / 6; };
// ---------------------------------------------------------------- labels: igloo's three labels per stone, igloo's face and reveal
// Sam, 2026-10-10: igloo's text and font. Each gem carries its family's name in the singular (Sam: "not reds, it's red";
// Basic Brown is Basic Brown); the active gem adds igloo's date slot as the shade count over the call to action.
// IBM Plex Mono Medium (SIL OFL), uppercase, Pearl Whisper. Reveal measured on igloo: leader 0.2 s, left-to-right alpha
// wipe 0.4 s, glyph roll 0.75 s (each letter counts down through the five glyphs after it in its 8-glyph block); hide
// 0.2 s, leader retracting horizontal segment first, alpha wiping right to left.
const FAM_ID = ['frosty-white', 'blissful-blue', 'playful-pink', 'vivid-violet', 'mellow-yellow', 'basic-brown', 'blushing-coral', 'stormy-grey', 'go-green', 'roaring-red'];
const NAME = ['Frosty White', 'Blissful Blue', 'Playful Pink', 'Vivid Violet', 'Mellow Yellow', 'Basic Brown', 'Blushing Coral', 'Stormy Grey', 'Go Green', 'Roaring Red'];
// igloo draws its white labels straight on the fog (about 2.5:1); darkened plates read as grey boxes, so they are off (Sam to sign off the contrast)
const PLATES = false;
const labLayer = document.getElementById('s2labels'), svg = document.getElementById('s2leaders'), linkLayer = document.getElementById('s2links');
const pad = (n, k) => String(n).padStart(k, '0');
const roll = (ch, k) => { const c = ch.charCodeAt(0); if (c <= 32 || !k) return ch; const b = c & ~7; return String.fromCharCode(b + ((c - b + k) % 8)); };
function makeLabel(lines, kind) {
  const el = document.createElement('div'); el.className = 's2lab'; const chars = [];
  for (const ln of lines) { const row = document.createElement('div');
    for (const ch of ln) { const s = document.createElement('span'); s.textContent = ch; s.style.opacity = '0'; row.appendChild(s); chars.push({ s, ch, shown: ch, a: 0, a0: 0 }); }
    el.appendChild(row); }
  labLayer.appendChild(el);
  let lead = null;
  if (kind !== 'temp') { lead = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); lead.setAttribute('fill', 'none'); lead.setAttribute('stroke', '#F7F6F3'); lead.setAttribute('stroke-width', '1'); svg.appendChild(lead); }
  return { el, chars, lead, kind, on: false, t0: -1e9, settled: true, hidden: true, lp: 0, plate: 0, w: 0, h: 0, side: null, x: 0, y: 0 };
}
function setOn(L, on, now, delay = 0) {
  if (L.on === on) return;
  L.on = on; L.t0 = now + delay; L.settled = false; L.hidden = false;
  if (!on) for (const c of L.chars) c.a0 = c.a;
}
function animLabel(L, now) {
  if (L.on ? L.settled : L.hidden) return;
  const t = Math.max(0, (now - L.t0) / 1000), n = L.chars.length, xs = (i) => (n > 1 ? i / (n - 1) : 0);
  const put = (c, a) => { if (Math.abs(a - c.a) > 1e-3 || a === 0 || a === 1) { c.a = a; c.s.style.opacity = a.toFixed(3); } };
  if (L.on) {
    if (REDUCE) { const a = Math.min(1, t / 0.2); L.chars.forEach((c) => put(c, a)); L.lp = 1; L.plate = a; if (a >= 1) L.settled = true; return; }
    const u = Math.min(1, t / 0.4), v = Math.min(1, t / 0.75);
    L.chars.forEach((c, i) => { const x = xs(i); put(c, Math.max(0, Math.min(1, 11 * u - 10 * x)));
      const tr = Math.max(0, Math.min(1, 2 * v - x)), g = roll(c.ch, Math.floor((1 - tr) * 5.753) % 8);
      if (g !== c.shown) { c.shown = g; c.s.textContent = g; } });
    L.lp = Math.min(1, t / 0.2); L.plate = Math.min(1, u * 1.5);
    if (t >= 0.75) L.settled = true;
  } else {
    const u = Math.min(1, t / 0.2);
    L.chars.forEach((c, i) => { put(c, Math.min(c.a0, REDUCE ? 1 - u : Math.max(0, Math.min(1, 11 * (1 - u) - 10 * xs(i)))));
      if (c.shown !== c.ch) { c.shown = c.ch; c.s.textContent = c.ch; } });
    L.lp = REDUCE ? (u < 1 ? 1 : 0) : 1 - u; L.plate = 1 - u;
    if (u >= 1) { L.hidden = true; L.lp = 0; L.plate = 0; }
  }
}
// anchors: igloo's stone-local bounding-box points, taken in the stone's rest frame (x right, y up, z toward the camera)
const vP = new V3();
function anchorObj(st, fx, fy, fz) {
  const b = st.viewBB, p = new V3(b.min.x + (b.max.x - b.min.x) * fx, b.min.y + (b.max.y - b.min.y) * fy, b.min.z + (b.max.z - b.min.z) * fz);
  return p.applyQuaternion(st.rest.clone().invert());
}
const toPx = (p) => { vP.copy(p).project(camera); return [(vP.x * 0.5 + 0.5) * cssW, (0.5 - vP.y * 0.5) * cssH]; };
const projA = (st, key) => toPx(vP.copy(st.anch[key]).applyMatrix4(st.mesh.matrixWorld));
function labelGeo(st, L, side) {
  const w = L.w, h = L.h, em = LAB_PX, ppu = st.slot.s / LONG;
  if (L.kind === 'title') {
    if (side === 'ul' || side === 'ur') { const s = side === 'ul' ? -1 : 1, A = projA(st, side === 'ul' ? 'titleL' : 'titleR');
      const leg = 0.38 * w, hz = 0.65 * w, P1 = [A[0] + s * leg, A[1] - leg], P2 = [P1[0] + s * hz, P1[1]];
      return { pts: [A, P1, P2], x: s < 0 ? P2[0] : P2[0] - w, y: P2[1] - 0.3 * em - h, right: s > 0 }; }
    const s = side === 'l' ? -1 : 1, A = projA(st, s < 0 ? 'sideL' : 'sideR'), len = Math.max(14, 0.18 * w), P2 = [A[0] + s * len, A[1]];
    return { pts: [A, [(A[0] + P2[0]) / 2, A[1]], P2], x: s > 0 ? P2[0] + 0.4 * em : P2[0] - 0.4 * em - w, y: A[1] - h / 2, right: s < 0 };
  }
  if (L.kind === 'temp') { const s = side === 'l' ? -1 : 1, A = projA(st, s > 0 ? 'temp' : 'tempL');
    return { pts: null, x: s > 0 ? A[0] + 0.3 * ppu : A[0] - 0.3 * ppu - w, y: A[1] - h / 2, right: s < 0 }; }
  const s = side === 'l' ? -1 : 1, A = projA(st, s > 0 ? 'cta' : 'ctaL'), len = w + 0.3 * em, P2 = [A[0] + s * len, A[1]];
  return { pts: [A, [(A[0] + P2[0]) / 2, A[1]], P2], x: s > 0 ? P2[0] - w : P2[0], y: A[1] - 0.25 * em - h, right: s > 0 };
}
// collision boxes keep about two characters of air round each label, so two names never read as one line
const rectOf = (g, L) => [g.x - 1.2 * LAB_PX, g.y - 6, g.x + L.w + 1.2 * LAB_PX, g.y + L.h + 6];
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
function gemBox(st) {
  const bb = st.geo.boundingBox, r = [1e9, 1e9, -1e9, -1e9];
  for (let c = 0; c < 8; c++) { const p = new V3(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).applyMatrix4(st.mesh.matrixWorld);
    const [x, y] = toPx(p); r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x); r[3] = Math.max(r[3], y); }
  const sh = 0.12 * (r[2] - r[0]), sv = 0.12 * (r[3] - r[1]); return [r[0] + sh, r[1] + sv, r[2] - sh, r[3] - sv];
}
const GUT = 16;
function badness(rect, j, boxes, placed) {
  let b = 0;
  if (rect[0] < GUT) b += (GUT - rect[0]) * 400; if (rect[2] > cssW - GUT) b += (rect[2] - cssW + GUT) * 400;
  if (rect[1] < 8) b += (8 - rect[1]) * 400; if (rect[3] > cssH - 8) b += (rect[3] - cssH + 8) * 400;
  boxes.forEach((bx, q) => { if (q !== j) b += overlap(rect, bx) * 4; });
  for (const p of placed) b += overlap(rect, p) * 8;
  return b;
}
// titles are placed once per layout (stable, no flicker); the extra labels of the active stone pick their side when shown
function layoutTitles() {
  const boxes = stones.map(gemBox), placed = [];
  stones.forEach((st, j) => {
    const L = st.labs.title, left = st.slot.u < 0.5;
    const order = PHONE ? (left ? ['r', 'l', 'ur', 'ul'] : ['l', 'r', 'ul', 'ur']) : ['ul', 'ur', 'r', 'l'];
    let best = null, bs = 1e18;
    for (const side of order) { const r = rectOf(labelGeo(st, L, side), L), b = badness(r, j, boxes, placed); if (b < bs - 1e-6) { bs = b; best = side; } if (b === 0) break; }
    L.side = best; placed.push(rectOf(labelGeo(st, L, best), L));
  });
}
function sideFor(st, L) {
  const j = stones.indexOf(st), boxes = stones.map(gemBox), placed = stones.filter((s) => s !== st).map((s) => rectOf(labelGeo(s, s.labs.title, s.labs.title.side), s.labs.title));
  let best = 'r', bs = 1e18; for (const side of ['r', 'l']) { const b = badness(rectOf(labelGeo(st, L, side), L), j, boxes, placed); if (b < bs) { bs = b; best = side; } } return best;
}
function drawLeader(L, g) {
  if (!L.lead) return;
  if (L.lp <= 0 || !g.pts) { L.lead.setAttribute('points', ''); return; }
  const [A, P1, P2] = g.pts, a = Math.min(1, L.lp / 0.5), b = Math.max(0, Math.min(1, (L.lp - 0.5) / 0.5));
  const q1 = [A[0] + (P1[0] - A[0]) * a, A[1] + (P1[1] - A[1]) * a];
  let s = `${A[0].toFixed(1)},${A[1].toFixed(1)} ${q1[0].toFixed(1)},${q1[1].toFixed(1)}`;
  if (b > 0) s += ` ${(P1[0] + (P2[0] - P1[0]) * b).toFixed(1)},${(P1[1] + (P2[1] - P1[1]) * b).toFixed(1)}`;
  L.lead.setAttribute('points', s);
}
function buildLabels() {
  for (const st of stones) {
    const j = st.j;
    st.labs = { title: makeLabel([NAME[j].toUpperCase()], 'title'),
      cta: makeLabel(['24 SHADES', TOUCH ? 'TAP TO EXPLORE' : 'CLICK TO EXPLORE'], 'cta') };
    for (const L of Object.values(st.labs)) { const r = L.el.getBoundingClientRect(); L.w = r.width; L.h = r.height; }
    const p = []; st.geo.attributes.position.array.forEach((v, i, a) => { if (i % 3 === 0) p.push(new V3(a[i], a[i + 1], a[i + 2]).applyQuaternion(st.rest)); });
    st.viewBB = new THREE.Box3().setFromPoints(p);
    st.anch = { titleL: anchorObj(st, 0.35, 0.85, 0.93), titleR: anchorObj(st, 0.65, 0.85, 0.93), sideL: anchorObj(st, 0.08, 0.55, 0.9), sideR: anchorObj(st, 0.92, 0.55, 0.9),
      temp: anchorObj(st, 0.70, 0.85, 0.93), tempL: anchorObj(st, 0.30, 0.85, 0.93), cta: anchorObj(st, 0.70, 0.25, 0.95), ctaL: anchorObj(st, 0.30, 0.25, 0.95) };
  }
}
function updateLabels(now) {
  const L4 = bgUniforms.uLab.value, LA = bgUniforms.uLabA.value, k = DPR; let n = 0;
  for (const st of stones) for (const L of Object.values(st.labs)) {
    animLabel(L, now);
    if (L.hidden) { L.el.style.visibility = 'hidden'; if (L.lead) L.lead.setAttribute('points', ''); continue; }
    L.el.style.visibility = 'visible';
    const g = labelGeo(st, L, L.side || 'r');
    L.el.classList.toggle('r', g.right);
    L.el.style.transform = `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, 0)`;
    drawLeader(L, g);
    if (PLATES && n < 30 && L.plate > 0) { L4.set([(g.x - 6) * k, (g.y - 6) * k, (g.x + L.w + 6) * k, (g.y + L.h + 6) * k], n * 4); LA[n] = L.plate; n++; }
  }
  bgUniforms.uLabN.value = n; bgUniforms.uLabFeather.value = 12 * k;
}

// ---------------------------------------------------------------- links (one real link per stone, over its projected box)
function buildLinks() {
  stones.forEach((st, j) => {
    const a = document.createElement('a'); a.className = 'gem-link'; a.href = `#/shades/${FAM_ID[st.j]}/`; a.setAttribute('aria-label', `${NAME[st.j]}, 24 shades`);
    a.addEventListener('focus', () => { if (a.matches(':focus-visible')) setActive(j, 'focus'); });
    a.addEventListener('blur', () => { if (activeBy === 'focus') setActive(-1, ''); });
    linkLayer.appendChild(a); st.link = a;
  });
}
function placeLinks() {
  for (const st of stones) { const b = gemBox(st), w = Math.max(44, b[2] - b[0]), h = Math.max(44, b[3] - b[1]), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    st.link.style.width = `${w.toFixed(1)}px`; st.link.style.height = `${h.toFixed(1)}px`; st.link.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0)`; }
}

// ---------------------------------------------------------------- the active stone: igloo shows its date label and the plexus
// on the stone in the centre band; with ten stones on one screen, the stone under the pointer (or with keyboard focus) is that stone
let active = -1, activeBy = '';
function setActive(j, by) {
  if (j === active) { activeBy = by; return; }
  const now = nowMs();
  if (active >= 0) { const st = stones[active]; setOn(st.labs.cta, false, now); plexusOff(st, now); }
  active = j; activeBy = by;
  if (j >= 0) { const st = stones[j];
    st.labs.cta.side = sideFor(st, st.labs.cta);
    setOn(st.labs.cta, true, now); if (!PHONE && !REDUCE) plexusOn(st, now); }
}

// ---------------------------------------------------------------- plexus (igloo's: 18 points on a cylinder round the stone, links to up to 3
// neighbours, "+" crosses, faint grey lines dashed by noise, depth-tested, growing in over 0.35 s; ours on the active stone)
const plexMat = new THREE.ShaderMaterial({ transparent: true, depthTest: true, depthWrite: false,
  vertexShader: 'attribute float aA; attribute float aD; varying float vA; varying float vD; void main() { vA = aA; vD = aD; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`precision highp float; varying float vA; varying float vD;
    float hh(float x) { return fract(sin(x * 12.9898) * 43758.5453); }
    void main() { float dash = vD < 0.0 ? 1.0 : step(0.28, hh(floor(vD * 16.0))); gl_FragColor = vec4(vec3(0.92, 0.93, 0.96), vA * dash); }` });
const plexi = [];
function plexusOn(st, now) {
  let P = plexi.find((p) => p.st === st); if (!P) {
    const r = rng(900 + st.j * 7), R = st.geo.boundingSphere.radius, pts = [];
    for (let i = 0; i < 18; i++) pts.push({ th: r() * 6.283, rad: R * (0.72 + 0.18 * r()), y0: (r() * 2 - 1) * R, w: (r() < 0.5 ? -1 : 1) * 0.25 * (0.6 + 0.4 * r()), vy: (r() - 0.5) * 0.12 });
    const links = [], deg = new Array(18).fill(0);
    for (let a = 0; a < 18; a++) { const pa = pts[a]; const near = [];
      for (let b = 0; b < 18; b++) if (b !== a) { const pb = pts[b]; const d = Math.hypot(pa.rad * Math.cos(pa.th) - pb.rad * Math.cos(pb.th), pa.y0 - pb.y0, pa.rad * Math.sin(pa.th) - pb.rad * Math.sin(pb.th)); if (d < 1.6 * R) near.push([d, b]); }
      near.sort((x, y) => x[0] - y[0]);
      for (const [, b] of near) { if (deg[a] >= 3) break; if (deg[b] >= 3 || links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue; links.push([a, b]); deg[a]++; deg[b]++; } }
    const nSeg = links.length + 36, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nSeg * 6), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(nSeg * 2), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(nSeg * 2), 1).setUsage(THREE.DynamicDrawUsage));
    const obj = new THREE.LineSegments(g, plexMat); obj.frustumCulled = false; obj.renderOrder = 30; scene.add(obj);
    P = { st, pts, links, obj, on: false, t0: 0 }; plexi.push(P);
  }
  P.on = true; P.t0 = now; P.obj.visible = true;
}
function plexusOff(st, now) { const P = plexi.find((p) => p.st === st); if (P && P.on) { P.on = false; P.t0 = now; } }
const camR = new V3(), camU = new V3();
function updatePlexus(now, t) {
  camR.setFromMatrixColumn(camera.matrixWorld, 0); camU.setFromMatrixColumn(camera.matrixWorld, 1);
  for (const P of plexi) {
    const e = (now - P.t0) / 1000, g = P.on ? Math.min(1, e / 0.35) : Math.max(0, 1 - e / 0.25);
    if (!P.on && g <= 0) { P.obj.visible = false; continue; }
    const c = P.st.group.position, R = P.st.geo.boundingSphere.radius, ppu = P.st.slot.s / LONG, cs = 3 / ppu;
    const W = P.pts.map((p) => { let y = p.y0 + p.vy * t; y = ((y + R) % (2 * R) + 2 * R) % (2 * R) - R; const th = p.th + p.w * t;
      const edge = 1 - Math.pow(Math.abs(y) / R, 4); return [c.x + p.rad * Math.cos(th), c.y + y, c.z + p.rad * Math.sin(th), edge]; });
    const pos = P.obj.geometry.attributes.position.array, aA = P.obj.geometry.attributes.aA.array, aD = P.obj.geometry.attributes.aD.array; let s = 0;
    const seg = (a, b, al, dash) => { pos.set(a, s * 6); pos.set(b, s * 6 + 3); aA[s * 2] = aA[s * 2 + 1] = al; if (dash) { aD[s * 2] = 0; aD[s * 2 + 1] = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); } else aD[s * 2] = aD[s * 2 + 1] = -1; s++; };
    for (const [a, b] of P.links) { const A = W[a], B = W[b]; const E = [A[0] + (B[0] - A[0]) * g, A[1] + (B[1] - A[1]) * g, A[2] + (B[2] - A[2]) * g]; seg(A.slice(0, 3), E, 0.22 * g * Math.min(A[3], B[3]), true); }
    for (const p of W) { const al = 0.45 * g * p[3];
      seg([p[0] - camR.x * cs, p[1] - camR.y * cs, p[2] - camR.z * cs], [p[0] + camR.x * cs, p[1] + camR.y * cs, p[2] + camR.z * cs], al, false);
      seg([p[0] - camU.x * cs, p[1] - camU.y * cs, p[2] - camU.z * cs], [p[0] + camU.x * cs, p[1] + camU.y * cs, p[2] + camU.z * cs], al, false); }
    P.obj.geometry.setDrawRange(0, s * 2);
    for (const k of ['position', 'aA', 'aD']) P.obj.geometry.attributes[k].needsUpdate = true;
  }
}

// ---------------------------------------------------------------- hover frost (igloo's, measured; our own shaders and textures)
// A pointer-frost buffer per hovered stone on its chart (the rest-frame front projection). Step at a fixed 60 Hz: flow advect,
// 4-neighbour max (dilation, so the front is ragged), capsule splat of radius 0.05 x smoothstep(0.1, 1, vel), decay 0.985;
// G holds this step's growth, the rim. Drawn on the gem: emissive += rim x #83a1c5 + lattice x rim x 10 + lattice x frost^2.
const FR = TOUCH ? 256 : 512, FHZ = TOUCH ? 30 : 60, FDECAY = TOUCH ? 0.985 * 0.985 : 0.985, FSCALE = 5.12;
const flowTex = (() => {      // smooth 2-channel flow noise, 128 x 128, periodic, normalised to mean 0.5, sd 0.25
  const N = 128, G = 16, r = rng(4242), d = new Uint8Array(N * N * 4);
  for (let c = 0; c < 2; c++) {
    const grid = Array.from({ length: G * G }, () => r()); const f = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / N * G, gy = y / N * G, ix = Math.floor(gx), iy = Math.floor(gy); let fx = gx - ix, fy = gy - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const v = (i, j) => grid[((j + G) % G) * G + ((i + G) % G)];
      f[y * N + x] = (v(ix, iy) * (1 - fx) + v(ix + 1, iy) * fx) * (1 - fy) + (v(ix, iy + 1) * (1 - fx) + v(ix + 1, iy + 1) * fx) * fy; }
    let m = 0; f.forEach((v) => { m += v; }); m /= f.length; let q = 0; f.forEach((v) => { q += (v - m) ** 2; }); const sd = Math.sqrt(q / f.length);
    for (let i = 0; i < N * N; i++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + 0.25 * (f[i] - m) / sd))));
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
const latTex = (() => {       // our triangle tile: jittered 12 x 12 grid, triangulated by the shorter diagonal, periodic; lines and vertex dots
  const S = 512, N = 12, r = rng(77), cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const P = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) P.push([(i + 0.5 + (r() * 2 - 1) * 0.38) * S / N, (j + 0.5 + (r() * 2 - 1) * 0.38) * S / N]);
  const at = (i, j) => { const p = P[((j % N + N) % N) * N + ((i % N + N) % N)]; return [p[0] + Math.floor(i / N) * S, p[1] + Math.floor(j / N) * S]; };
  const E = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d2 = at(i + 1, j + 1);
    E.push([a, b], [a, c]); E.push(Math.hypot(a[0] - d2[0], a[1] - d2[1]) < Math.hypot(b[0] - c[0], b[1] - c[1]) ? [a, d2] : [b, c]); }
  g.strokeStyle = 'rgba(255,255,255,0.62)'; g.lineWidth = 1.7; g.lineCap = 'round';
  for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); for (const [a, b] of E) { g.moveTo(a[0] + ox, a[1] + oy); g.lineTo(b[0] + ox, b[1] + oy); } g.stroke(); }
  g.fillStyle = '#fff'; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) for (const p of P) { g.beginPath(); g.arc(p[0] + ox, p[1] + oy, 1.5, 0, 6.283); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t; })();
const blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat); blackTex.needsUpdate = true;
const stepMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
  uniforms: { tPrev: { value: null }, tFlow: { value: flowTex }, uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() }, uR: { value: 0 }, uRes: { value: FR }, uDecay: { value: FDECAY }, uStatic: { value: 0 }, uAmp: { value: 0 } },
  fragmentShader: /* glsl */`precision highp float; uniform sampler2D tPrev, tFlow; uniform vec2 uA, uB; uniform float uR, uRes, uDecay, uStatic, uAmp;
    void main() { vec2 uv = gl_FragCoord.xy / uRes;
      if (uStatic > 0.5) { float v = (1.0 - smoothstep(0.08, 0.12, distance(uv, uB))) * uAmp; gl_FragColor = vec4(v, 0.0, 0.0, 1.0); return; }
      vec2 A = texture(tFlow, uv * 3.0).rg; vec2 off = clamp((A - 0.5) / 0.25 * 0.22 + vec2(0.10, -0.07), -1.0, 1.0) / uRes;
      vec2 u2 = uv + off; float px = 1.0 / uRes;
      float prev = texture(tPrev, u2).r;
      float v = max(max(texture(tPrev, u2 + vec2(px, 0.0)).r, texture(tPrev, u2 - vec2(px, 0.0)).r), max(texture(tPrev, u2 + vec2(0.0, px)).r, texture(tPrev, u2 - vec2(0.0, px)).r));
      if (uR > 0.0) { vec2 ab = uB - uA; float h = clamp(dot(uv - uA, ab) / max(dot(ab, ab), 1e-10), 0.0, 1.0); float d = length(uv - uA - ab * h);
        float s = clamp(1.0 - d / uR, 0.0, 1.0); v += s * s * s; }
      v = min(uDecay * v, 1.0);
      gl_FragColor = vec4(v, max(v - prev, 0.0), 0.0, 1.0); }` });
const stepScene = fsScene(stepMat);
const pool = [0, 1, 2].map(() => ({ a: RT(FR, FR, { depthBuffer: false }), b: RT(FR, FR, { depthBuffer: false }), st: null, last: -1e9, acc: 0, cur: null, prevStep: null,
  vel: 0, target: 0, lastMove: -1e9, over: false, force: 0, hitT: 0 }));
function clearRT(rt) { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); }
function slotFor(st, now) {
  let P = pool.find((p) => p.st === st); if (P) return P;
  P = pool.reduce((m, p) => (p.last < m.last ? p : m), pool[0]);
  if (P.st) { P.st.mats.B.userData.U.uFrostOn.value = 0; P.st.mats.B.userData.U.tFrost.value = blackTex; }
  clearRT(P.a); clearRT(P.b); renderer.setRenderTarget(null);
  Object.assign(P, { st, last: now, acc: 0, cur: null, prevStep: null, vel: 0, target: 0, lastMove: -1e9, over: false, force: 0, hitT: 0 });
  st.mats.B.userData.U.uFrostOn.value = 1; st.mats.B.userData.U.tFrost.value = P.a.texture; return P;
}
const chartUV = (st, worldPoint) => { const p = st.mesh.worldToLocal(worldPoint.clone()).applyQuaternion(st.rest); return new THREE.Vector2(p.x / FSCALE + 0.5, p.y / FSCALE + 0.5); };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function stepFrost(now, dt) {
  for (const P of pool) {
    if (!P.st) continue;
    if (now - P.last > 6000) { P.st.mats.B.userData.U.uFrostOn.value = 0; P.st.mats.B.userData.U.tFrost.value = blackTex; P.st = null; continue; }
    if (REDUCE) {       // a static patch: in 0.15 s, out 1.5 s, no rim
      const amp = P.over ? Math.min(1, (now - P.hitT) / 150) : Math.max(0, 1 - (now - P.lastMove) / 1500);
      stepMat.uniforms.uStatic.value = 1; stepMat.uniforms.uAmp.value = amp; if (P.cur) stepMat.uniforms.uB.value.copy(P.cur);
      renderer.setRenderTarget(P.b); renderer.render(stepScene, fsCam); [P.a, P.b] = [P.b, P.a]; P.st.mats.B.userData.U.tFrost.value = P.a.texture; continue;
    }
    stepMat.uniforms.uStatic.value = 0;
    P.acc = Math.min(P.acc + dt, (VCLOCK ? 30 : 2) / FHZ); let steps = Math.floor(P.acc * FHZ + 1e-6); P.acc -= steps / FHZ;
    while (steps-- > 0) {
      let r = 0;
      if (P.cur) {
        const from = P.prevStep || P.cur, e = from.distanceTo(P.cur);
        if (now - P.lastMove > 150 || e > 0.3) { P.vel = 0; P.target = 0; }
        P.target = Math.min(1, Math.max(0, (P.target + 6 * (P.over ? e : 0)) * 0.88));
        P.vel += (1 - Math.pow(1 - P.target, 5) - P.vel) * 0.1;
        if (now < P.force) P.vel = Math.max(P.vel, 0.6);
        r = P.over || now < P.force ? 0.05 * sstep(0.1, 1, P.vel) : 0;
        stepMat.uniforms.uA.value.copy(from); stepMat.uniforms.uB.value.copy(P.cur); P.prevStep = P.cur.clone();
      }
      stepMat.uniforms.uR.value = r; stepMat.uniforms.tPrev.value = P.a.texture;
      renderer.setRenderTarget(P.b); renderer.render(stepScene, fsCam); [P.a, P.b] = [P.b, P.a];
    }
    P.st.mats.B.userData.U.tFrost.value = P.a.texture;
  }
  renderer.setRenderTarget(null);
}
// the lattice repeat per stone: triangle edge 0.045 of the stone's projected width, at least 6 px
function latticeScale(st) {
  const wPx = st.slot.s * (st.viewBB.max.x - st.viewBB.min.x) / LONG, edgePx = Math.max(0.045 * wPx, 6);
  const edgeUV = edgePx / wPx * ((st.viewBB.max.x - st.viewBB.min.x) / FSCALE); return (1 / 12) / edgeUV;
}

// ---------------------------------------------------------------- pointer: hover, parallax (igloo's camera orbit as a turn in place)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const par = { x: 0, y: 0, tx: 0, ty: 0, touch: false };
let hoverSt = null, downAt = null;
function pick(cx, cy) {
  ndc.set((cx / cssW) * 2 - 1, -(cy / cssH) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(stones.filter((s) => s.L >= 1 && s.group.visible).map((s) => s.mesh), false); if (!hits.length) return null;
  const st = stones.find((s) => s.mesh === hits[0].object); return { st, point: hits[0].point };
}
function onMove(e) {
  if (!ready || !live || w2 > 0.3) { if (hoverSt) { hoverSt = null; if (activeBy === 'pointer') setActive(-1, ''); } return; }
  const now = nowMs(), touch = e.pointerType === 'touch';
  par.touch = touch; if (!touch || e.buttons) { par.tx = Math.max(-1, Math.min(1, (e.clientX / cssW) * 2 - 1)); par.ty = Math.max(-1, Math.min(1, (e.clientY / cssH) * 2 - 1)); }
  if (touch && !e.buttons) return;
  const h = pick(e.clientX, e.clientY);
  if (hoverSt && (!h || h.st !== hoverSt)) { const P = pool.find((p) => p.st === hoverSt); if (P) { P.over = false; P.vel = 0; P.target = 0; P.lastMove = now; } }
  if (h) { const P = slotFor(h.st, now), uv = chartUV(h.st, h.point);
    if (!P.over) { P.over = true; P.vel = 0; P.target = 0; P.prevStep = null; P.hitT = now; }
    P.cur = uv; P.lastMove = now; P.last = now; }
  if ((h ? h.st : null) !== hoverSt) { hoverSt = h ? h.st : null; document.body.classList.toggle('on-gem', !!hoverSt);
    if (!touch) { if (hoverSt) setActive(stones.indexOf(hoverSt), 'pointer'); else if (activeBy === 'pointer') setActive(-1, ''); } }
}
addEventListener('pointermove', onMove, { passive: true });
addEventListener('pointerdown', (e) => {
  if (!ready || !live) return;
  const now = nowMs(); downAt = [e.clientX, e.clientY];
  if (e.pointerType === 'touch') { const h = pick(e.clientX, e.clientY);
    if (h) { const P = slotFor(h.st, now); P.cur = chartUV(h.st, h.point); P.prevStep = P.cur.clone(); P.force = now + 350; P.last = now; P.lastMove = now; P.hitT = now; } }
}, { passive: true });
const lift = (e) => { if (e.pointerType === 'touch') { par.tx = 0; par.ty = 0; if (hoverSt) { const P = pool.find((p) => p.st === hoverSt); if (P) { P.over = false; P.lastMove = nowMs(); } hoverSt = null; } } };
addEventListener('pointerup', lift, { passive: true }); addEventListener('pointercancel', lift, { passive: true });
addEventListener('pointerout', (e) => { if (!e.relatedTarget) { par.tx = 0; par.ty = 0; } });
const qPar = new THREE.Quaternion(), ePar = new THREE.Euler(0, 0, 0, 'YXZ');
function updateParallax(dt) {
  if (REDUCE) { qPar.identity(); return; }
  const k = 1 - Math.pow(1 - 0.035 * (par.touch ? 0.5 : 1), dt * 60);
  par.x += (par.tx - par.x) * k; par.y += (par.ty - par.y) * k;
  ePar.set(par.y * 0.0768, -par.x * 0.1536, 0, 'YXZ'); qPar.setFromEuler(ePar);       // igloo: 4.4 deg pitch, 8.8 deg yaw at full deflection
}


// ---------------------------------------------------------------- section 2 in the hero: the flights and the hand-over
// Sam, 2026-10-10: the blocks leave the logo one at a time and travel a long, slow way before they stop in section 2 as gems.
// Each block j lifts off at CAS0 + j GAP screens and lands FLY screens later; its path is a long bowed curve with a slow
// lift and a long settle (ease 0.42, 0, 0.12, 1). The logo itself never flies up: it recedes with the hero camera's curve.
const CAS0 = S2T.CAS0, GAP = S2T.GAP, FLY = S2T.FLY;
const bez = (x1, y1, x2, y2) => (x) => {          // cubic-bezier easing, solved for t by Newton steps
  if (x <= 0) return 0; if (x >= 1) return 1;
  let t = x; for (let i = 0; i < 8; i++) { const a = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; if (Math.abs(d) < 1e-6) break; t = Math.min(1, Math.max(0, t - a / d)); }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3; };
const flightEase = bez(0.42, 0, 0.12, 1);
const Lof = (S, j) => Math.max(0, Math.min(1, (S - (CAS0 + j * GAP)) / FLY));
let S = 0;
// the flying copy of each hero block: the same triangles as the hero's block (taken from the logo geometry), matte black,
// its family's shade rising in its edges as it nears the change
function blockGeometryFromLogo(i) {
  const g = logo.geometry, P = g.attributes.position.array, ID = g.attributes.aId.array, CEN = g.attributes.aCentroid.array, AH = g.attributes.aH.array;
  const relief = U.uRelief.value, out = [];
  for (let v = 0; v < ID.length; v++) if (Math.round(ID[v]) === i)
    out.push((P[v * 3] - CEN[v * 3]) * 0.992, (P[v * 3 + 1] - CEN[v * 3 + 1]) * 0.992, (P[v * 3 + 2] + AH[v] * relief - CEN[v * 3 + 2]) * 0.992);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); bg.computeVertexNormals(); return bg;
}
const blockOf = [];          // family j -> hero block index
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _p = new V3(), _q = new THREE.Quaternion(), _s = new V3();
function startPose(j, outP, outQ, outS) {
  const b = blocks[blockOf[j]];
  _m.makeTranslation(b.c.x, b.c.y, 0).premultiply(logo.matrixWorld);                    // the block's centre in the logo, at rest
  _m2.multiplyMatrices(camA.matrixWorldInverse, _m).premultiply(camera.matrixWorld);       // same view-space pose under our camera
  _m2.decompose(outP, outQ, outS);
}
const cubic = (a, b, c, d, t, out) => { const u = 1 - t; return out.set(
  u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
  u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  u * u * u * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t * t * t * d.z); };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const P0 = new V3(), P1 = new V3(), P2 = new V3(), Q0 = new THREE.Quaternion(), S0 = new V3(), tmpE = new THREE.Euler(), tmpQ2 = new THREE.Quaternion();
function flyPose(st, t) {
  const L = st.L, e = flightEase(L);
  startPose(st.j, P0, Q0, S0);
  const p1 = st.base, D = P0.distanceTo(p1), side = st.side;
  const dir = _p.subVectors(p1, P0).normalize(), perp = new V3().crossVectors(dir, new V3(0, 0, 1)).normalize();
  P1.copy(P0).addScaledVector(dir, 0.18 * D).addScaledVector(perp, side * 0.38 * D).add(new V3(0, 0.12 * D, 0.30 * D));   // lift, swing out to one side
  P2.copy(p1).add(new V3(0, 0.30 * D, 0.28 * D)).addScaledVector(perp, -side * 0.12 * D);                                  // come in from above and in front
  const pos = cubic(P0, P1, P2, p1, e, new V3());
  // the block: tumbles as it goes, its edges warming to its shade, then folds into a point of light
  const spin = 4 * e * (1 - e);
  tmpE.set(st.tumble.x * spin, st.tumble.y * spin + st.tumble.y * 0.6 * e, st.tumble.z * spin);
  const qb = Q0.clone().multiply(tmpQ2.setFromEuler(tmpE));
  const bs = (1 - sm(0.42, 0.62, L)) * S0.x;
  st.blk.visible = bs > 1e-4 && !REDUCE; st.blk.position.copy(pos); st.blk.quaternion.copy(qb); st.blk.scale.setScalar(Math.max(1e-4, bs));
  st.blk.material.emissiveIntensity = 0.7 * sm(0.18, 0.55, L) * (1 - sm(0.55, 0.62, L));   // a warm-up, never a flat sticker
  // the gem: grows out of that light and turns into its resting pose as it settles
  const gs = sm(0.50, 0.78, L);
  st.group.visible = gs > 1e-4; st.group.scale.setScalar(Math.max(1e-4, gs));
  const a = REDUCE ? 0 : 0.1 * sm(0.85, 1, L);
  const wob = new THREE.Euler(a * st.sig * Math.sin(st.w * t + KW[0] * st.s), a * st.sig * Math.sin(st.w * t + KW[1] * st.s), a * st.sig * Math.sin(st.w * t + KW[2] * st.s));
  const qRest = qPar.clone().multiply(new THREE.Quaternion().setFromEuler(wob)).multiply(st.rest);
  st.group.quaternion.copy(qb).slerp(qRest, sm(0.45, 1, e));
  st.group.position.copy(pos); st.group.updateMatrixWorld(true);
  st.mats.B.userData.U.uCore.value = 1.5 * sm(0.5, 0.85, L);
}
function placeStone(st, t) {
  if (REDUCE) {                                   // reduced motion: no flight; the block goes and the gem is at its slot
    const on = st.L >= 0.5; st.blk.visible = false; st.group.visible = on; st.group.scale.setScalar(1);
    st.group.quaternion.copy(st.rest); st.group.position.copy(st.base); st.group.updateMatrixWorld(true); st.mats.B.userData.U.uCore.value = 1.5; return;
  }
  if (st.L <= 0) { st.blk.visible = false; st.group.visible = false; return; }
  if (st.L < 1) { flyPose(st, t); return; }
  st.blk.visible = false; st.group.visible = true; st.group.scale.setScalar(1); st.mats.B.userData.U.uCore.value = 1.5;
  const a = 0.1;
  const e = new THREE.Euler(a * st.sig * Math.sin(st.w * t + KW[0] * st.s), a * st.sig * Math.sin(st.w * t + KW[1] * st.s), a * st.sig * Math.sin(st.w * t + KW[2] * st.s));
  st.group.quaternion.copy(qPar).multiply(new THREE.Quaternion().setFromEuler(e)).multiply(st.rest);
  st.group.position.copy(st.base); st.group.updateMatrixWorld(true);
}
function poseAll(t) {
  const sh = REDUCE ? 0 : 0.0129;
  camera.position.set(0, 0, 0); camera.up.set(0, 1, 0);
  camera.quaternion.setFromEuler(new THREE.Euler(sh * n6(t, BP), sh * n6(t, BY), sh * n6(t, BR), 'YXZ')); camera.updateMatrixWorld();
  for (const st of stones) placeStone(st, t);
}

// ---------------------------------------------------------------- build (after the intro; one stone per frame)
let ready = false, failed = false, started = false, live = 0, w2 = 0, t2 = 0;
function placeBases() {
  const SL = slots(), th = Math.tan(THREE.MathUtils.degToRad(15));
  stones.forEach((st, q) => { const sl = SL[q], d = LONG * fpx / sl.s; st.slot = sl;
    st.base = new V3((2 * sl.u - 1) * d * th * ASP / camera.zoom, (1 - 2 * sl.v) * d * th / camera.zoom, -d); });
}
async function build(yieldFrame) {
  started = true;
  try {
    envTex = pmrem.fromEquirectangular(equirect(1024, 512, studioFn)).texture;
    REGION_NAMES.forEach((name, j) => { blockOf[j] = blocks.findIndex((b) => b.shade === j); });
    for (let j = 0; j < 10; j++) {
      const [fam, shade, hex] = FAM[j];
      const geo = gemGeometry(201 + j * 23);
      const group = new THREE.Group(); scene.add(group);
      const mesh = new THREE.Mesh(geo); group.add(mesh);
      const st = { j, fam, shade, hex, group, mesh, geo, mats: {}, L: 0 };
      st.mats.B = matC(hex, geo.userData.planes); mesh.material = st.mats.B;
      const r = rng(500 + j * 11);
      st.rest = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.7, r() * Math.PI * 2, (r() - 0.5) * 0.6));
      st.s = r(); st.sig = st.s >= 0.5 ? 1 : -1; st.w = 0.3 * (1 + 0.1 * (2 * r() - 1));
      const rr = rng(700 + j * 13); st.side = rr() < 0.5 ? -1 : 1;
      st.tumble = new V3((rr() < 0.5 ? -1 : 1) * 2.5, (rr() < 0.5 ? -1 : 1) * 3.0, (rr() < 0.5 ? -1 : 1) * 1.2);
      st.blk = new THREE.Mesh(blockGeometryFromLogo(blockOf[j]), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.42, metalness: 0, envMap: envTex, envMapIntensity: 0.55,
        emissive: new THREE.Color(hex), emissiveIntensity: 0 }));
      st.blk.visible = false; scene.add(st.blk);
      group.visible = false; stones.push(st);
      await yieldFrame();
    }
    makeTargets(); placeBases(); buildLabels(); buildLinks(); layoutFinal();
    for (const st of stones) { const U2 = st.mats.B.userData.U; U2.uRest.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(st.rest)); U2.uLatN.value = latticeScale(st); }
    // first draw of every program off screen, so the first flight costs no compile
    for (const st of stones) { st.group.visible = true; st.blk.visible = true; }
    const pc = renderer.getClearColor(new THREE.Color()), pa = renderer.getClearAlpha();
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
    renderS2(); renderer.setClearColor(pc, pa);
    for (const st of stones) { st.group.visible = false; st.blk.visible = false; }
    ready = true;
  } catch (e) { failed = true; console.warn('section 2', e); }
}
function resize(w, h) {
  cssW = w; cssH = h; ASP = w / h; PHONE = ASP < 0.9; LAB_PX = PHONE ? 12 : 13;
  camera.aspect = ASP; camera.zoom = Math.min(1, 1.25 * ASP); camera.updateProjectionMatrix();
  fpx = (cssH / 2) / Math.tan(THREE.MathUtils.degToRad(15)) * camera.zoom;
  if (!ready) return;
  makeTargets(); placeBases();
  for (const st of stones) { const L = st.labs.title; const r = L.el.getBoundingClientRect(); L.w = r.width; L.h = r.height; }
  for (const st of stones) st.mats.B.userData.U.uLatN.value = latticeScale(st);
  layoutFinal();
}
// title sides are chosen once, from every gem at its final resting pose (never re-chosen mid-flight, so nothing jumps)
function layoutFinal() {
  const saved = stones.map((s) => [s.group.position.clone(), s.group.quaternion.clone(), s.group.scale.clone(), s.group.visible]);
  for (const st of stones) { st.group.position.copy(st.base); st.group.quaternion.copy(st.rest); st.group.scale.setScalar(1); st.group.visible = true; st.group.updateMatrixWorld(true); }
  const cq = camera.quaternion.clone(); camera.position.set(0, 0, 0); camera.quaternion.identity(); camera.updateMatrixWorld();
  layoutTitles();
  camera.quaternion.copy(cq); camera.updateMatrixWorld();
  stones.forEach((s, q) => { s.group.position.copy(saved[q][0]); s.group.quaternion.copy(saved[q][1]); s.group.scale.copy(saved[q][2]); s.group.visible = saved[q][3]; s.group.updateMatrixWorld(true); });
}

// ---------------------------------------------------------------- per frame: called by the hero's step()
// tp1: the first wipe (hero to section 2), tp2: the second (section 2 to the Wall)
function update(Sv, tp1, tp2, t, dt) {
  S = Sv; t2 = t;
  const now = nowMs();
  live = tp1 > 0 && tp2 < 1 ? 1 : 0; w2 = tp2;
  if (!ready) return;
  for (const st of stones) st.L = Lof(S, st.j);
  updateParallax(dt); poseAll(t);
  const show = tp1 > 0.5 && tp2 < 0.25;
  for (const st of stones) { const landed = st.L >= (REDUCE ? 0.6 : 0.92);
    setOn(st.labs.title, show && landed, now); }
  labLayer.style.visibility = live ? 'visible' : 'hidden';
  const linksOn = tp1 >= 1 && tp2 < 0.3;
  linkLayer.style.visibility = linksOn ? 'visible' : 'hidden';
  for (const st of stones) { const on = linksOn && st.L >= 1; st.link.tabIndex = on ? 0 : -1; st.link.style.pointerEvents = on ? 'auto' : 'none'; if (!on && active === stones.indexOf(st)) setActive(-1, ''); }
  if (!linksOn && active >= 0) setActive(-1, '');
  stepFrost(now, dt); updateLabels(now); placeLinks(); updatePlexus(now, t);
  bgUniforms.uScroll.value = 2.15 + 0.3 * (S - S2T.W1END);
}
function renderS2() {
  bgUniforms.uRes.value.set(W(), H()); bgUniforms.uTime.value = REDUCE ? 7 : t2; bgUniforms.uFrame.value = (frameNo++) % 4096; bgLayout(REDUCE ? 7 : t2);
  for (const st of stones) { const U2 = st.mats.B.userData.U; U2.uRes.value.set(W(), H()); }
  renderer.setClearColor(0x000000, 0);
  const vis = stones.map((s) => [s.group.visible, s.blk.visible]);
  for (const st of stones) { st.group.visible = false; st.blk.visible = false; } for (const P of plexi) P.obj.userData.v = P.obj.visible, P.obj.visible = false;
  renderer.setRenderTarget(rtBG); renderer.render(scene, camera);           // the background the gems refract
  stones.forEach((st, q) => { st.group.visible = vis[q][0]; st.blk.visible = vis[q][1]; st.mats.B.userData.U.tBG.value = rtBG.texture; });
  for (const P of plexi) P.obj.visible = P.obj.userData.v;
  renderer.setRenderTarget(rtMain); renderer.render(scene, camera);
  runBloomAndComposite();
}
let frameNo = 0;
function render() {
  if (!ready) return;
  const pc = renderer.getClearColor(new THREE.Color()), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  renderS2();
  renderer.toneMapping = tm; renderer.setClearColor(pc, pa); renderer.setRenderTarget(null);
}
// a hero block is hidden once its flying copy has taken over (or, under reduced motion, once its gem is at its slot)
const hidden = (i, Sv = S) => { if (!ready) return false; const j = blockOf.indexOf(i); if (j < 0) return false; const L = Lof(Sv, j); return REDUCE ? L >= 0.5 : L > 0; };
const logoLeft = () => !ready || stones.some((st) => (REDUCE ? st.L < 0.5 : st.L <= 0));
/*TEST*/window.__s2 = () => ({ ready, failed, live, S, L: stones.map((s) => +s.L.toFixed(3)), active, labels: stones.map((s) => (s.labs ? !s.labs.title.hidden : null)) });/*TEST-END*/
return { build, resize, update, render, hidden, logoLeft, get ready() { return ready; }, get failed() { return failed; }, get started() { return started; }, get out() { return rtOut ? rtOut.texture : null; } };

})();
