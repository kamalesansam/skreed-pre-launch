// The hover frost (igloo's, measured; our own shaders and textures; prototype v11.4 template.html, section 2 "hover
// frost"; section-2.md 5 "Hover"): a pointer-frost buffer per hovered stone on its chart (the rest-frame front
// projection). Step at a fixed 60 Hz: flow advect, 4-neighbour max (dilation, so the front is ragged), capsule splat of
// radius 0.05 x smoothstep(0.1, 1, vel), decay 0.985; G holds this step's growth, the rim. Pool of 3 ping-pong pairs,
// least recently used. Phones: 256 px at 30 Hz, a stronger decay.
import { CanvasTexture, DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, RepeatWrapping, SRGBColorSpace, ShaderMaterial, Vector2, type Mesh, type Quaternion, type Vector3, type WebGLRenderer, type WebGLRenderTarget } from 'three';
import { FS_VERT, RT, fsCam, fsScene } from './background.ts';
import { rng, smooth } from './gemGeometry.ts';
import type { GemMaterial } from './gemMaterial.ts';

export const FSCALE = 5.12;

export interface FrostStone { mesh: Mesh; rest: Quaternion; mats: { B: GemMaterial } }
export interface FrostSlot { a: WebGLRenderTarget; b: WebGLRenderTarget; st: FrostStone | null; last: number; acc: number; cur: Vector2 | null; prevStep: Vector2 | null; vel: number; target: number; lastMove: number; over: boolean; force: number; hitT: number }

export function createFrost(renderer: WebGLRenderer, o: { touch: boolean; reduce: boolean; vclock?: boolean }) {
  const TOUCH = o.touch, REDUCE = o.reduce;
  const FR = TOUCH ? 256 : 512, FHZ = TOUCH ? 30 : 60, FDECAY = TOUCH ? 0.985 * 0.985 : 0.985;
  const flowTex = (() => {      // smooth 2-channel flow noise, 128 x 128, periodic, normalised to mean 0.5, sd 0.25
    const N = 128, G = 16, r = rng(4242), d = new Uint8Array(N * N * 4);
    for (let c = 0; c < 2; c++) {
      const grid = Array.from({ length: G * G }, () => r()); const f = new Float32Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const gx = x / N * G, gy = y / N * G, ix = Math.floor(gx), iy = Math.floor(gy); let fx = gx - ix, fy = gy - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        const v = (i: number, j: number) => grid[((j + G) % G) * G + ((i + G) % G)];
        f[y * N + x] = (v(ix, iy) * (1 - fx) + v(ix + 1, iy) * fx) * (1 - fy) + (v(ix, iy + 1) * (1 - fx) + v(ix + 1, iy + 1) * fx) * fy; }
      let m = 0; f.forEach((v) => { m += v; }); m /= f.length; let q = 0; f.forEach((v) => { q += (v - m) ** 2; }); const sd = Math.sqrt(q / f.length);
      for (let i = 0; i < N * N; i++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + 0.25 * (f[i] - m) / sd))));
    }
    const t = new DataTexture(d, N, N, RGBAFormat); t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = t.minFilter = LinearFilter; t.needsUpdate = true; return t; })();
  const latTex = (() => {       // our triangle tile: jittered 12 x 12 grid, triangulated by the shorter diagonal, periodic; lines and vertex dots
    const S = 512, N = 12, r = rng(77), cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d')!;
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
    const P: number[][] = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) P.push([(i + 0.5 + (r() * 2 - 1) * 0.38) * S / N, (j + 0.5 + (r() * 2 - 1) * 0.38) * S / N]);
    const at = (i: number, j: number) => { const p = P[((j % N + N) % N) * N + ((i % N + N) % N)]; return [p[0] + Math.floor(i / N) * S, p[1] + Math.floor(j / N) * S]; };
    const E: number[][][] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d2 = at(i + 1, j + 1);
      E.push([a, b], [a, c]); E.push(Math.hypot(a[0] - d2[0], a[1] - d2[1]) < Math.hypot(b[0] - c[0], b[1] - c[1]) ? [a, d2] : [b, c]); }
    g.strokeStyle = 'rgba(255,255,255,0.62)'; g.lineWidth = 1.7; g.lineCap = 'round';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); for (const [a, b] of E) { g.moveTo(a[0] + ox, a[1] + oy); g.lineTo(b[0] + ox, b[1] + oy); } g.stroke(); }
    g.fillStyle = '#fff'; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) for (const p of P) { g.beginPath(); g.arc(p[0] + ox, p[1] + oy, 1.5, 0, 6.283); g.fill(); }
    const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.minFilter = LinearMipmapLinearFilter; t.generateMipmaps = true; return t; })();
  const blackTex = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat); blackTex.needsUpdate = true;
  const stepMat = new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: FS_VERT,
    uniforms: { tPrev: { value: null }, tFlow: { value: flowTex }, uA: { value: new Vector2() }, uB: { value: new Vector2() }, uR: { value: 0 }, uRes: { value: FR }, uDecay: { value: FDECAY }, uStatic: { value: 0 }, uAmp: { value: 0 } },
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
  const pool: FrostSlot[] = [0, 1, 2].map(() => ({ a: RT(FR, FR, { depthBuffer: false }), b: RT(FR, FR, { depthBuffer: false }), st: null, last: -1e9, acc: 0, cur: null, prevStep: null,
    vel: 0, target: 0, lastMove: -1e9, over: false, force: 0, hitT: 0 }));
  function clearRT(rt: WebGLRenderTarget) { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); }
  function slotFor(st: FrostStone, now: number): FrostSlot {
    let P = pool.find((p) => p.st === st); if (P) return P;
    P = pool.reduce((m, p) => (p.last < m.last ? p : m), pool[0]);
    if (P.st) { P.st.mats.B.userData.U.uFrostOn.value = 0; P.st.mats.B.userData.U.tFrost.value = blackTex; }
    clearRT(P.a); clearRT(P.b); renderer.setRenderTarget(null);
    Object.assign(P, { st, last: now, acc: 0, cur: null, prevStep: null, vel: 0, target: 0, lastMove: -1e9, over: false, force: 0, hitT: 0 });
    st.mats.B.userData.U.uFrostOn.value = 1; st.mats.B.userData.U.tFrost.value = P.a.texture; return P;
  }
  const chartUV = (st: FrostStone, worldPoint: Vector3) => { const p = st.mesh.worldToLocal(worldPoint.clone()).applyQuaternion(st.rest); return new Vector2(p.x / FSCALE + 0.5, p.y / FSCALE + 0.5); };
  function step(now: number, dt: number) {
    for (const P of pool) {
      if (!P.st) continue;
      if (now - P.last > 6000) { P.st.mats.B.userData.U.uFrostOn.value = 0; P.st.mats.B.userData.U.tFrost.value = blackTex; P.st = null; continue; }
      if (REDUCE) {       // a static patch: in 0.15 s, out 1.5 s, no rim
        const amp = P.over ? Math.min(1, (now - P.hitT) / 150) : Math.max(0, 1 - (now - P.lastMove) / 1500);
        stepMat.uniforms.uStatic.value = 1; stepMat.uniforms.uAmp.value = amp; if (P.cur) stepMat.uniforms.uB.value.copy(P.cur);
        renderer.setRenderTarget(P.b); renderer.render(stepScene, fsCam); [P.a, P.b] = [P.b, P.a]; P.st.mats.B.userData.U.tFrost.value = P.a.texture; continue;
      }
      stepMat.uniforms.uStatic.value = 0;
      P.acc = Math.min(P.acc + dt, (o.vclock ? 30 : 2) / FHZ); let steps = Math.floor(P.acc * FHZ + 1e-6); P.acc -= steps / FHZ;
      while (steps-- > 0) {
        let r = 0;
        if (P.cur) {
          const from = P.prevStep || P.cur, e = from.distanceTo(P.cur);
          if (now - P.lastMove > 150 || e > 0.3) { P.vel = 0; P.target = 0; }
          P.target = Math.min(1, Math.max(0, (P.target + 6 * (P.over ? e : 0)) * 0.88));
          P.vel += (1 - Math.pow(1 - P.target, 5) - P.vel) * 0.1;
          if (now < P.force) P.vel = Math.max(P.vel, 0.6);
          r = P.over || now < P.force ? 0.05 * smooth(0.1, 1, P.vel) : 0;
          stepMat.uniforms.uA.value.copy(from); stepMat.uniforms.uB.value.copy(P.cur); P.prevStep = P.cur.clone();
        }
        stepMat.uniforms.uR.value = r; stepMat.uniforms.tPrev.value = P.a.texture;
        renderer.setRenderTarget(P.b); renderer.render(stepScene, fsCam); [P.a, P.b] = [P.b, P.a];
      }
      P.st.mats.B.userData.U.tFrost.value = P.a.texture;
    }
    renderer.setRenderTarget(null);
  }
  return {
    blackTex, latTex, pool, slotFor, chartUV, step,
    dispose() { for (const P of pool) { P.a.dispose(); P.b.dispose(); } flowTex.dispose(); latTex.dispose(); blackTex.dispose(); stepMat.dispose(); },
  };
}
export type Frost = ReturnType<typeof createFrost>;
