// Section 2's background (igloo's section 2, re-created, our code; section-2.md 5 "Background") and its render passes
// (prototype v11.4 template.html, section 2 "background", "render targets and full-screen passes"): fog from one 64 x 64
// noise texture sampled at two scales, mapped through the measured 21-stop ramp; jittered 1 px dots twinkling on a 10 s
// triangle wave; grain at dither level; six defocused wireframe gem sprites (our own atlas); three soft patches of shade
// hue (E-fog-hue: config/fog-hues.ts, the clock in hues.ts, written by gems.ts and section3/ground.ts). Then our own bloom: prefilter
// (stones only, alpha = 1), 4-tap box down chain, tent up chain mixed by radius, and the composite into rtOut (sRGB
// colour, alpha = what the gems and flights cover).
import { BufferGeometry, CanvasTexture, DataTexture, Float32BufferAttribute, HalfFloatType, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace, OrthographicCamera, RGBAFormat, RedFormat, RepeatWrapping, Scene, ShaderMaterial, UnsignedByteType, Vector2, WebGLRenderTarget, type WebGLRenderer } from 'three';

function fogNoise64(seed = 249): Uint8Array<ArrayBuffer> {
  const AMP: Record<string, number> = { 1: 0.01499, 1.414: 0.02238, 2: 0.02556, 2.236: 0.02357, 2.828: 0.02694, 3: 0.01788, 3.162: 0.02118, 3.606: 0.00736, 4: 0.00495, 4.123: 0.00612, 4.243: 0.00562, 4.472: 0.00355 };
  let s = seed >>> 0; const rnd = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  const modes: [number, number, number, number][] = [];
  for (let ky = 0; ky <= 4; ky++) for (let kx = -4; kx <= 4; kx++) { if (ky === 0 && kx <= 0) continue; const r = Math.round(Math.hypot(kx, ky) * 1000) / 1000; if (!(r in AMP)) continue; modes.push([kx, ky, 2 * AMP[r], rnd() * 2 * Math.PI]); }
  const f = new Float64Array(4096);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { let v = 0; for (const [kx, ky, a, ph] of modes) v += a * Math.cos(2 * Math.PI * (kx * x + ky * y) / 64 + ph); f[y * 64 + x] = v; }
  let m = 0; for (const v of f) m += v; m /= 4096; let q = 0; for (const v of f) q += (v - m) ** 2; const sd = Math.sqrt(q / 4096);
  const out = new Uint8Array(4096); for (let i = 0; i < 4096; i++) out[i] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + (f[i] - m) * (0.1373 / sd))))); return out;
}
function lcg(seed: number) { let s = seed >>> 0; return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296); }
function gemAtlas(): HTMLCanvasElement {
  const C = 256, cv = document.createElement('canvas'); cv.width = C * 3; cv.height = C; const g = cv.getContext('2d')!; g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  [{ seed: 11, blur: 2.5, n: 7 }, { seed: 29, blur: 2.5, n: 9 }, { seed: 47, blur: 10, n: 8 }].forEach((cell, ci) => {
    const r = lcg(cell.seed), n = cell.n, pts: number[][] = []; const tw = 0.55 + 0.1 * r(), ch = 0.35 + 0.1 * r(), pd = 0.75 + 0.2 * r();
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.2 * (r() - 0.5); pts.push([tw * Math.cos(a), ch, tw * Math.sin(a)]); }
    for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI * 2 + 0.2 * (r() - 0.5); const k = 0.9 + 0.2 * r(); pts.push([k * Math.cos(a), 0, k * Math.sin(a)]); }
    pts.push([0.05 * (r() - 0.5), -pd, 0.05 * (r() - 0.5)]);
    const edges: [number, number][] = []; for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n], [n + i, n + (i + 1) % n], [i, n + i], [(i + 1) % n, n + i], [n + i, 2 * n]);
    for (let i = 0; i < n; i += 2) edges.push([i, (i + Math.floor(n / 2)) % n]);
    const ax = 0.5 + 0.6 * r(), ay = r() * 6.28, az = 0.3 * (r() - 0.5);
    const rot = ([x, y, z]: number[]) => { let c = Math.cos(ay), s = Math.sin(ay); [x, z] = [c * x + s * z, -s * x + c * z]; c = Math.cos(ax); s = Math.sin(ax); [y, z] = [c * y - s * z, s * y + c * z]; c = Math.cos(az); s = Math.sin(az); [x, y] = [c * x - s * y, s * x + c * y]; return [x, y]; };
    const P = pts.map(rot).map(([x, y]) => [ci * C + C / 2 + x * C * 0.36, C / 2 - y * C * 0.36]);
    g.save(); g.beginPath(); g.rect(ci * C, 0, C, C); g.clip(); g.filter = `blur(${cell.blur}px)`; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); for (const [a, b] of edges) { g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 4; i++) { const p = P[Math.floor(r() * P.length)]; g.beginPath(); g.arc(p[0] + 14 * (r() - 0.5), p[1] + 14 * (r() - 0.5), 3, 0, 6.283); g.fill(); }
    g.restore();
  });
  return cv;
}
const SHAPES = [[-4.7, 4.6, -3.1, 1.15, 0.74, 0], [-1.6, 1.9, -3.7, 1.40, 0.21, 1], [1.9, 6.4, -2.9, 0.85, 0.57, 2], [2.6, -0.4, -6.9, 1.20, 0.33, 0], [4.4, 3.4, -4.4, 1.05, 0.88, 2], [-3.2, -5.6, -5.2, 1.10, 0.46, 1]];

export const FS_VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createBackground() {
  const uniforms = {
    uRes: { value: new Vector2() }, uTime: { value: 0 }, uScroll: { value: 2.15 }, uFrame: { value: 0 }, uPre: { value: 0 },
    tNoise: { value: null as DataTexture | null }, tShapes: { value: null as CanvasTexture | null }, uS: { value: new Float32Array(24) }, uSB: { value: new Float32Array(24) },
    uLab: { value: new Float32Array(120) }, uLabA: { value: new Float32Array(30) }, uLabN: { value: 0 }, uLabFeather: { value: 10 },
    // the fog's shade hues (config/fog-hues.ts; written per frame by hues.ts, uHueAmt 0 until then)
    uHueAmt: { value: 0 }, uHueSize: { value: 1 }, uHueLo: { value: 0.56 }, uHueSlot: { value: new Float32Array(12) }, uHueSlotAB: { value: new Float32Array(6) },
  };
  const nt = new DataTexture(fogNoise64(249), 64, 64, RedFormat, UnsignedByteType);
  nt.wrapS = nt.wrapT = RepeatWrapping; nt.magFilter = nt.minFilter = LinearFilter; nt.needsUpdate = true; uniforms.tNoise.value = nt;
  const st = new CanvasTexture(gemAtlas()); st.flipY = false; st.minFilter = st.magFilter = LinearFilter; st.generateMipmaps = false; st.colorSpace = NoColorSpace; uniforms.tShapes.value = st;
  const material = new ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
  precision highp float;
  uniform vec2 uRes; uniform float uTime, uScroll, uFrame, uPre, uLabN, uLabFeather; uniform sampler2D tNoise, tShapes;
  uniform vec4 uS[6]; uniform vec4 uSB[6]; uniform vec4 uLab[30]; uniform float uLabA[30];
  uniform float uHueAmt, uHueSize, uHueLo; uniform vec4 uHueSlot[3]; uniform vec2 uHueSlotAB[3];
  const vec3 R[21] = vec3[21](vec3(237,239,244), vec3(230,232,241), vec3(223,226,238), vec3(216,219,231), vec3(208,212,223), vec3(201,205,216), vec3(193,197,209),
    vec3(184,189,201), vec3(175,181,192), vec3(166,171,184), vec3(157,161,175), vec3(147,152,165), vec3(136,142,154), vec3(122,128,140),
    vec3(107,113,126), vec3(97,103,116), vec3(86,92,105), vec3(76,81,94), vec3(63,68,81), vec3(51,57,69), vec3(35,41,54));
  vec3 lin(vec3 c) { c /= 255.0; return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 enc(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
  vec3 dec(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 ramp(float p) { float x = clamp(p, 0.0, 1.0) * 20.0; int i = min(int(x), 19); return mix(lin(R[i]), lin(R[i + 1]), x - float(i)); }
  // OKLab (Ottosson 2020) from and to linear sRGB, for the hues
  vec3 oklab(vec3 c) { vec3 l = pow(max(vec3(dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)), dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)), dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005))), 0.0), vec3(1.0 / 3.0));
    return vec3(dot(l, vec3(0.2104542553, 0.7936177850, -0.0040720468)), dot(l, vec3(1.9779984951, -2.4285922050, 0.4505937099)), dot(l, vec3(0.0259040371, 0.7827717662, -0.8086757660))); }
  vec3 unlab(vec3 k) { vec3 l = vec3(dot(k, vec3(1.0, 0.3963377774, 0.2158037573)), dot(k, vec3(1.0, -0.1055613458, -0.0638541728)), dot(k, vec3(1.0, -0.0894841775, -1.2914855480))); l = l * l * l;
    return vec3(dot(l, vec3(4.0767416621, -3.3077115913, 0.2309699292)), dot(l, vec3(-1.2684380046, 2.6097574011, -0.3413193965)), dot(l, vec3(-0.0041960863, -0.7034186147, 1.7076147010))); }
  uint hu(uvec3 v) { v = v * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return v.x ^ v.y ^ v.z; }
  float h1(vec2 c, float s) { return float(hu(uvec3(ivec3(int(floor(c.x)) + 4096, int(floor(c.y)) + 4096, int(s)))) & 0xffffffu) / 16777216.0; }
  void main() {
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;
    vec2 s = vec2(uv.x * asp, uv.y) * 0.3; float t = uTime * 0.075;
    float p = 0.5 * (texture(tNoise, s + vec2(-t, 0.25 * t - 0.1625 * uScroll)).r + texture(tNoise, s * 0.5 + vec2(t, -0.5 * t)).r);
    // final on-screen ramp (grade and bloom folded in), or the pre-grade fog that igloo's stones refract (look D's pass A)
    vec3 col = uPre > 0.5 ? mix(lin(vec3(201.0, 208.0, 223.0)), lin(vec3(84.0, 91.0, 107.0)), p) : ramp(p);
    // the fog's shade hues (E-fog-hue): three patches of the fog, shaped by its own noise and riding its scroll, each
    // take one shade's hue at the fog's lightness (OKLab a and b, L kept). Each patch's place (xy), its sin^2 envelope
    // (z) and its shade come per frame from config/fog-hues.ts createHueSlots, through hues.ts. A finer octave breaks the
    // patch's outline, the edge falls off over 1.75 sd of the noise, and the hue sits in the fog's lighter clouds (lp),
    // so the patch's edge is the fog's own rather than a round blob
    if (uHueAmt > 0.0) { vec2 ab = vec2(0.0); float wsum = 0.0, lp = mix(0.25, 1.0, smoothstep(0.6, 0.4, p));
      for (int k = 0; k < 3; k++) {
        vec2 hs = s * uHueSize + uHueSlot[k].xy + vec2(-0.15 * t, 0.04 * t - 0.1625 * uScroll * uHueSize);
        float n = 0.5 + 1.38 * (0.6 * texture(tNoise, hs).r + 0.4 * texture(tNoise, hs * 2.3 + vec2(0.37, 0.71) + vec2(0.1 * t, -0.06 * t)).r - 0.5);   // two octaves, back to sd 0.137
        float m = uHueSlot[k].z * smoothstep(uHueLo, uHueLo + 0.24, n) * lp;
        ab += m * uHueSlotAB[k]; wsum += m; }
      vec3 k3 = oklab(col); k3.yz = mix(k3.yz, ab / max(wsum, 1e-4), min(wsum, 1.0) * uHueAmt); col = max(unlab(k3), 0.0); }
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
  function layout(time: number, Wd: number, Hd: number) {
    const asp = Wd / Hd, zoom = Math.min(1, 1.25 * asp), th = Math.tan(Math.PI / 8), scroll = uniforms.uScroll.value;
    const S = uniforms.uS.value, SB = uniforms.uSB.value;
    SHAPES.forEach(([x, y, z, rad, rnd, cell], i) => {
      const X = x * Math.min(1, Math.max(0.65, asp * 0.5)), Y = y - 2.5 + 2.5 * scroll, zv = z - 5;
      const ndcX = X / (-zv * th * asp) * zoom, ndcY = Y / (-zv * th) * zoom;
      S.set([(ndcX * 0.5 + 0.5) * Wd, (0.5 - ndcY * 0.5) * Hd, rad / (-zv * th) * zoom * 0.5 * Hd, 0.2 * rnd * time + 1.25 * scroll * (0.1 + 0.4 * rnd)], i * 4);
      SB.set([cell, 0.27 * 0.65, x, y], i * 4);
    });
  }
  return { uniforms, material, layout, dispose() { nt.dispose(); st.dispose(); material.dispose(); } };
}
export type Background = ReturnType<typeof createBackground>;

// ---------------------------------------------------------------- render targets and full-screen passes
export const fsGeo = new BufferGeometry(); fsGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
export const fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
export function fsMesh(mat: ShaderMaterial): Mesh { const m = new Mesh(fsGeo, mat); m.frustumCulled = false; return m; }
export function fsScene(mat: ShaderMaterial): Scene { const s = new Scene(); s.add(fsMesh(mat)); return s; }
export const RT = (w: number, h: number, o: ConstructorParameters<typeof WebGLRenderTarget>[2] = {}) => new WebGLRenderTarget(w, h, { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: true, ...o });

/** Gem C's bloom and the composite into rtOut (BLOOM.C: threshold 0.75, intensity 0.7, radius 0.75) */
export function createPasses(renderer: WebGLRenderer) {
  let rtMain: WebGLRenderTarget | null = null, rtBG: WebGLRenderTarget | null = null, rtOut: WebGLRenderTarget | null = null, bloomRTs: { down: WebGLRenderTarget; up: WebGLRenderTarget }[] = [];
  function makeTargets(w: number, h: number) {
    for (const t of [rtMain, rtBG, rtOut]) if (t) t.dispose(); for (const b of bloomRTs) { b.down.dispose(); b.up.dispose(); }
    rtMain = RT(w, h, { samples: 4 });
    rtOut = new WebGLRenderTarget(w, h, { depthBuffer: false });     // sRGB-encoded colour, alpha = what the gems and flights cover
    rtBG = RT(w, h, { minFilter: LinearMipmapLinearFilter, generateMipmaps: true, depthBuffer: false });
    bloomRTs = []; let bw = Math.max(1, w >> 1), bh = Math.max(1, h >> 1);
    for (let i = 0; i < 6; i++) { bloomRTs.push({ down: RT(bw, bh, { depthBuffer: false }), up: RT(bw, bh, { depthBuffer: false }) }); bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); }
  }
  // bloom (our own): prefilter (stones only, alpha = 1), 4-tap box down chain, tent up chain mixed by radius
  const bloomPre = new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    uniforms: { tSrc: { value: null }, uTexel: { value: new Vector2() }, uThr: { value: 0.2 }, uKnee: { value: 0.025 } },
    fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr, uKnee;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec4 a = texture(tSrc, uv); vec3 c = a.rgb * a.a;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); gl_FragColor = vec4(c * smoothstep(uThr - uKnee, uThr + uKnee, l), 1.0); }` });
  const bloomDown = new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    uniforms: { tSrc: { value: null }, uTexel: { value: new Vector2() }, uSrcTexel: { value: new Vector2() } },
    fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel, uSrcTexel;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec2 o = uSrcTexel;
      vec3 c = texture(tSrc, uv + vec2(-o.x, -o.y)).rgb + texture(tSrc, uv + vec2(o.x, -o.y)).rgb + texture(tSrc, uv + vec2(-o.x, o.y)).rgb + texture(tSrc, uv + vec2(o.x, o.y)).rgb;
      c = 0.5 * c / 4.0 + 0.5 * texture(tSrc, uv).rgb; gl_FragColor = vec4(c, 1.0); }` });
  const bloomUp = new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    uniforms: { tSmall: { value: null }, tSupport: { value: null }, uTexel: { value: new Vector2() }, uSmallTexel: { value: new Vector2() }, uRadius: { value: 0.85 } },
    fragmentShader: /* glsl */`precision highp float; uniform sampler2D tSmall, tSupport; uniform vec2 uTexel, uSmallTexel; uniform float uRadius;
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec2 o = uSmallTexel;
      vec3 c = texture(tSmall, uv).rgb * 4.0;
      c += (texture(tSmall, uv + vec2(o.x, 0)).rgb + texture(tSmall, uv - vec2(o.x, 0)).rgb + texture(tSmall, uv + vec2(0, o.y)).rgb + texture(tSmall, uv - vec2(0, o.y)).rgb) * 2.0;
      c += texture(tSmall, uv + o).rgb + texture(tSmall, uv - o).rgb + texture(tSmall, uv + vec2(o.x, -o.y)).rgb + texture(tSmall, uv + vec2(-o.x, o.y)).rgb;
      c /= 16.0; gl_FragColor = vec4(mix(texture(tSupport, uv).rgb, c, uRadius), 1.0); }` });
  const composite = new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    uniforms: { tMain: { value: null }, tBloom: { value: null }, uTexel: { value: new Vector2() }, uIntensity: { value: 1 }, uScreen: { value: 1 }, uMask: { value: 0 } },
    fragmentShader: /* glsl */`precision highp float; uniform sampler2D tMain, tBloom; uniform vec2 uTexel; uniform float uIntensity, uScreen, uMask;
    vec3 enc(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
    void main() { vec2 uv = gl_FragCoord.xy * uTexel; vec3 a = texture(tMain, uv).rgb; vec3 b = texture(tBloom, uv).rgb * uIntensity;
      vec3 c = uScreen > 0.5 ? a + b - a * b : a + b; if (uMask > 0.5) c = vec3(texture(tMain, uv).a); gl_FragColor = vec4(enc(c), clamp(texture(tMain, uv).a, 0.0, 1.0)); }` });
  const S_pre = fsScene(bloomPre), S_down = fsScene(bloomDown), S_up = fsScene(bloomUp), S_comp = fsScene(composite);
  const BLOOM = { thr: 0.75, knee: 0.25, radius: 0.75, intensity: 0.7, screen: 0 };   // look C
  function runBloomAndComposite(w: number, h: number) {
    const b0 = bloomRTs[0].down;
    bloomPre.uniforms.tSrc.value = rtMain!.texture; bloomPre.uniforms.uTexel.value.set(1 / b0.width, 1 / b0.height);
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
    composite.uniforms.tMain.value = rtMain!.texture; composite.uniforms.uMask.value = 0; composite.uniforms.tBloom.value = small.texture; composite.uniforms.uTexel.value.set(1 / w, 1 / h);
    composite.uniforms.uIntensity.value = BLOOM.intensity; composite.uniforms.uScreen.value = BLOOM.screen;
    renderer.setRenderTarget(rtOut); renderer.render(S_comp, fsCam);
  }
  return {
    makeTargets, runBloomAndComposite,
    get rtMain() { return rtMain; }, get rtBG() { return rtBG; }, get rtOut() { return rtOut; },
    dispose() { for (const t of [rtMain, rtBG, rtOut]) t?.dispose(); for (const b of bloomRTs) { b.down.dispose(); b.up.dispose(); } for (const m of [bloomPre, bloomDown, bloomUp, composite]) m.dispose(); },
  };
}
export type Passes = ReturnType<typeof createPasses>;
