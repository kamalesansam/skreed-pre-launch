// Section 5's jars (docs/specs/section-5.md 3 "The glass", "The beads", 5 "The island modules"): the four glass jars
// over section 2's fog, drawn by the hero island where the section's slots are. Its own lazy chunk (the marker
// SIGNUP_MARK; scripts/hero/budget.mjs attributes it), import()ed by hero.ts at idle after section 4's cloud has warmed
// or when the section nears. jar.bin (scripts/signup/jar-bin.mjs, products.bin's layout) is read by section 4's
// loader-free parser; the beads are a pellet instanced 320 times a jar on a packing from jars-math.ts, each a catalog
// shade; the glass is our own one-pass material (the gems' precedent): it refracts the frame behind it (the fog with the
// beads already in it), a fresnel rim, one key highlight and a soft studio reflection, display values in and out, no
// tone curve. Two targets a frame: A, the fog quad with the beads; B, a copy of A under the glass. The slots' rects are
// cached (section4/layout.ts, the same triggers) and offset by scrollY each frame, so the jars scroll with the page and
// sit where the CSS puts them. The fill: a follow raises your jar over FILL_MS on power2.out (instant under reduced
// motion), its beads coloured by the platform in the order the follows came. The DOM's data-collected attributes are the
// follows' source of truth at the start; 'skreed:signup' events carry each press after that.
import { BufferGeometry, Color, Float32BufferAttribute, FrontSide, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, NoToneMapping, OrthographicCamera, PerspectiveCamera, Scene, ShaderMaterial, SphereGeometry, Vector2, Vector3, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { FILL_MS, JAR_BIN_URL, SIGNUP_FOLLOWS, SIGNUP_JARS, jarById, jarLevel, type SignupFrame, type SignupIsland } from '../../../config/signup.ts';
import { PEARL_WHISPER, NIGHT } from '../../../config/tokens.ts';
import { fetchProductsBin } from '../section4/products-bin.ts';
import { watchLayout } from '../section4/layout.ts';
import { JAR, bandOwner, beadHex, levelAt, packBeads, placeJar, type Bead, type Placement, type Slot } from './jars-math.ts';

export const SIGNUP_MARK = 'skreed:signup';

export interface JarsOptions {
  renderer: WebGLRenderer;
  /** section#signup */
  root: HTMLElement;
  reduced: boolean;
  /** the canvas's pixel ratio */
  dpr: number;
  /** section 3's fog ground, this frame's (the quad behind the jars) */
  fog: () => Texture | null;
  /** every reading of the section's layout (the page scroll re-evaluates from here) */
  onLayout?(): void;
}

export interface JarsPlan { on: boolean; tex: Texture | null }

export interface JarsScene {
  readonly mark: string;
  readonly ready: boolean;
  readonly failed: boolean;
  /** the frame: draws when the section is in view or it is the fourth wipe's far side; the texture is the fog with the jars */
  step(f: { t: number; dt: number; wipe: number; cover: number }): JarsPlan;
  /** jar.bin, the geometry and the beads; the programs compiled one a frame */
  load(): Promise<void>;
  resize(w: number, h: number): void;
  /** document px: the exit seam's trigger (the body's bottom at the viewport's bottom) and the wrap's landing; NaN before a reading */
  exitY(): number;
  restY(): number;
  inView(): boolean;
  pour(id: string): void;
  follows(ids: readonly string[]): void;
  /** hooks: one jar at its level over --night, 320 x 400, the pixels bottom-up (the stills script flips them) */
  still(id: string, level?: number): Promise<{ width: number; height: number; data: Uint8Array } | null>;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

const FS_VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
/** the fog quad (A's floor) and the copy (B's floor): the frame's bytes as written, or a flat colour for a still */
const COPY_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tMap; uniform vec2 uRes; uniform vec3 uFlat; uniform float uUseFlat;
void main() { vec3 c = texture2D(tMap, gl_FragCoord.xy / uRes).rgb; gl_FragColor = vec4(mix(c, uFlat, uUseFlat), 1.0); }`;
const BEAD_VERT = /* glsl */`
attribute vec3 aOffset; attribute float aH; attribute vec3 aColor;
uniform float uLevel, uBead, uBand;
varying vec3 vN; varying vec3 vC; varying vec3 vV;
void main() {
  float vis = 1.0 - smoothstep(uLevel - uBand, uLevel, aH);
  vec3 p = position * (uBead * vis) + aOffset;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal); vC = aColor; vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const BEAD_FRAG = /* glsl */`
precision highp float;
uniform vec3 uKey, uAmbient, uLightCol;
varying vec3 vN; varying vec3 vC; varying vec3 vV;
vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float d = max(dot(n, uKey), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.22;
  vec3 h = normalize(uKey + v); float spec = pow(max(dot(n, h), 0.0), 40.0) * 0.3;
  vec3 lin = toLin(vC) * (uAmbient + uLightCol * d * 0.85) + uLightCol * (rim + spec) * 0.5;
  gl_FragColor = vec4(toSrgb(lin), 1.0);
}`;
const GLASS_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const GLASS_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tFrame; uniform vec2 uRes, uRefract; uniform vec3 uKey, uLightCol, uDark, uTint;
varying vec3 vN; varying vec3 vV;
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 off = -n.xy * uRefract * (1.0 - ndv * 0.6);
  vec3 back = texture2D(tFrame, clamp(uv + off, vec2(0.001), vec2(0.999))).rgb * uTint;
  vec3 r = reflect(-v, n); float sky = smoothstep(-0.25, 0.9, r.y);
  vec3 refl = mix(uDark, uLightCol, sky);
  vec3 h = normalize(uKey + v); float spec = pow(max(dot(n, h), 0.0), 180.0);
  vec3 col = mix(back, refl, F * 0.85) + uLightCol * spec * 0.9 + uLightCol * F * 0.12;
  gl_FragColor = vec4(min(col, 1.0), 1.0);
}`;

const hex3 = (hex: string): Vector3 => { const c = new Color(hex); return new Vector3(c.r, c.g, c.b); };

interface Jar { id: string; group: { beads: Mesh; glass: Mesh }; geo: InstancedBufferGeometry; colours: InstancedBufferAttribute; beads: Bead[]; level: number; from: number; to: number; t0: number; placement: Placement | null; slot: Slot | null }

export function createJars(o: JarsOptions): JarsScene & Partial<SignupIsland> {
  const { renderer, root, reduced } = o;
  const H = document.documentElement;
  const body = root.querySelector<HTMLElement>('.su-body');
  const slotEls = [...root.querySelectorAll<HTMLElement>('.su-slot[data-slot]')];
  // each platform's bead colours, the family's catalog hexes joined at build into its slot's markup (Signup.astro), so the
  // shade table never ships in this chunk
  const colourLists = new Map<string, readonly string[]>(slotEls.map((el) => [el.dataset.slot ?? '', (el.dataset.colours ?? '').split(',').filter((h) => /^#[0-9a-f]{6}$/i.test(h))]));
  const coloursOf = (id: string): readonly string[] => colourLists.get(id) ?? [];
  let disposed = false, ready = false, failed = false, W = 8, H8 = 8, cssW = 8, cssH = 8, dpr = o.dpr, lastT = 0, warmed = false;
  const ac = new AbortController();

  // ---- the layout, cached: the section's top and height, the body's bottom and the four slots' document rects
  let top = NaN, height = 1, bodyBottom = NaN, slotRects = new Map<string, Slot>();
  const lay = watchLayout({
    html: H,
    read: () => {
      if (!root.getClientRects().length) return null;
      const r = root.getBoundingClientRect(), b = (body ?? root).getBoundingClientRect();
      bodyBottom = b.bottom + scrollY;
      slotRects = new Map(slotEls.map((el) => { const s = el.getBoundingClientRect(); return [el.dataset.slot ?? '', { x: s.left, y: s.top + scrollY, w: s.width, h: s.height }]; }));
      return { top: r.top + scrollY, height: r.height };
    },
    watch: [root, body, document.getElementById('find'), document.getElementById('room'), H],
    onMeasure: (l) => { top = l.top; height = l.height; o.onLayout?.(); },
  });
  const current = () => { if (!Number.isFinite(top)) lay.measure(); else lay.get(); };

  // ---- the stage: a fixed camera, the fog quad, the beads, the glass; two targets
  const cam = new PerspectiveCamera(JAR.fovDeg, 1, 0.1, 100);
  cam.position.set(0, 0, JAR.distance); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const fsGeo = new BufferGeometry(); fsGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const copyU = { tMap: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uFlat: { value: hex3(NIGHT) }, uUseFlat: { value: 0 } };
  const copyMat = new ShaderMaterial({ uniforms: copyU, vertexShader: FS_VERT, fragmentShader: COPY_FRAG, depthTest: false, depthWrite: false });
  const copyMesh = new Mesh(fsGeo, copyMat); copyMesh.frustumCulled = false;
  const copyScene = new Scene(); copyScene.add(copyMesh);
  const keyDir = new Vector3(0.3, 0.8, 0.55).normalize();
  const beadU = { uLevel: { value: 0 }, uBead: { value: JAR.beadR }, uBand: { value: JAR.band }, uKey: { value: keyDir }, uAmbient: { value: new Vector3(0.42, 0.43, 0.47) }, uLightCol: { value: hex3(PEARL_WHISPER) } };
  const glassShared = { tFrame: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uKey: { value: keyDir }, uLightCol: { value: hex3(PEARL_WHISPER) }, uDark: { value: new Vector3(0.22, 0.24, 0.3) }, uTint: { value: new Vector3(0.96, 0.98, 1.0) } };
  const sceneA = new Scene(), sceneB = new Scene();
  const fogQuad = new Mesh(fsGeo, copyMat); fogQuad.frustumCulled = false; fogQuad.renderOrder = -10; sceneA.add(fogQuad);
  const copyB = new Mesh(fsGeo, copyMat); copyB.frustumCulled = false; copyB.renderOrder = -10; sceneB.add(copyB);
  let rtA = new WebGLRenderTarget(8, 8, { depthBuffer: true }), rtB = new WebGLRenderTarget(8, 8, { depthBuffer: true });
  const pellet = new SphereGeometry(1, 10, 7); pellet.scale(1, 0.72, 1);
  let jarGeo: BufferGeometry | null = null;
  const jars: Jar[] = [];
  const _cc = new Color();

  function buildJar(def: { id: string; level: number }, seed: number): Jar {
    const beads = packBeads(JAR.perJar, seed);
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', pellet.getAttribute('position')); geo.setAttribute('normal', pellet.getAttribute('normal')); geo.setIndex(pellet.getIndex());
    geo.instanceCount = beads.length;
    const off = new Float32Array(beads.length * 3), hs = new Float32Array(beads.length), cols = new Float32Array(beads.length * 3);
    beads.forEach((b, k) => { off[k * 3] = b.x; off[k * 3 + 1] = b.y; off[k * 3 + 2] = b.z; hs[k] = b.h; });
    geo.setAttribute('aOffset', new InstancedBufferAttribute(off, 3)); geo.setAttribute('aH', new InstancedBufferAttribute(hs, 1));
    const colours = new InstancedBufferAttribute(cols, 3);
    geo.setAttribute('aColor', colours);
    const beadMat = new ShaderMaterial({ uniforms: { ...beadU, uLevel: { value: def.level } }, vertexShader: BEAD_VERT, fragmentShader: BEAD_FRAG });
    const beadsMesh = new Mesh(geo, beadMat); beadsMesh.frustumCulled = false; beadsMesh.visible = false; sceneA.add(beadsMesh);
    const glassMat = new ShaderMaterial({ uniforms: { ...glassShared, uRefract: { value: new Vector2(0, 0) } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, side: FrontSide });
    const glass = new Mesh(jarGeo ?? pellet, glassMat); glass.frustumCulled = false; glass.visible = false; sceneB.add(glass);
    return { id: def.id, group: { beads: beadsMesh, glass }, geo, colours, beads, level: def.level, from: def.level, to: def.level, t0: -1, placement: null, slot: null };
  }
  /** the beads' colours: a platform jar wears its families in catalog order round the packing; your jar the bands of the follows so far */
  function colour(j: Jar, order: readonly string[]) {
    const arr = j.colours.array as Float32Array;
    let hexes: readonly string[] = [], owner: ((h: number) => number) | null = null, lists: (readonly string[])[] = [];
    if (j.id === 'yours') {
      const worths = order.map((id) => jarById(id)?.worth ?? 0), total = SIGNUP_FOLLOWS.reduce((a, f) => a + f.worth, 0);
      lists = order.map((id) => coloursOf(id));
      owner = (h) => bandOwner(h, worths, total);
    } else hexes = coloursOf(j.id);
    j.beads.forEach((b, k) => {
      const list = owner ? (lists[owner(b.h)] ?? []) : hexes;
      const c = _cc.set(list.length ? beadHex(k, list) : '#000000');
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    });
    j.colours.needsUpdate = true;
  }
  /** the follows as the DOM carries them (data-collected, 1-based order) */
  const domFollows = (): string[] => [...root.querySelectorAll<HTMLElement>('li.su-jar[data-collected]')].sort((a, b) => Number(a.dataset.collected) - Number(b.dataset.collected)).map((li) => li.dataset.id ?? '').filter(Boolean);
  let order: string[] = domFollows();
  const yoursLevelOf = (ids: readonly string[]) => Math.min(1, ids.reduce((a, id) => a + jarLevel(jarById(id) ?? SIGNUP_JARS[0]), 0));

  function onSignup(e: Event) {
    const d = (e as CustomEvent<{ id: string; follows: string[] }>).detail;
    if (!d) return;
    order = d.follows.filter((id) => jarById(id));
    const y = jars.find((j) => j.id === 'yours');
    if (!y) return;
    colour(y, order);
    // no id: the follows as saved (the DOM script's mount after a reload within the visit): the jar set at once
    if (!d.id) { y.level = y.from = y.to = yoursLevelOf(order); y.t0 = -1; (y.group.beads.material as ShaderMaterial).uniforms.uLevel.value = y.level; return; }
    y.from = y.level; y.to = yoursLevelOf(order); y.t0 = lastT;
  }
  addEventListener('skreed:signup', onSignup);

  // ---- rendering
  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
  const compile = async (sc: Scene, c: PerspectiveCamera | OrthographicCamera, target: WebGLRenderTarget) => {
    const tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(target);
    const done = renderer.compileAsync(sc, c, sc);
    renderer.setRenderTarget(null); renderer.toneMapping = tm;
    await done;
  };
  /** the jars placed from their slots this frame; a jar whose slot is off screen by more than its height is skipped */
  function place(view: { w: number; h: number }, sy: number) {
    for (const j of jars) {
      const r = slotRects.get(j.id);
      if (!r) { j.group.beads.visible = j.group.glass.visible = false; continue; }
      const slot: Slot = { x: r.x, y: r.y - sy, w: r.w, h: r.h };
      const vis = slot.y + slot.h > -slot.h && slot.y < view.h + slot.h;
      j.group.beads.visible = j.group.glass.visible = vis;
      if (!vis) continue;
      const p = placeJar(slot, view);
      j.placement = p; j.slot = slot;
      for (const m of [j.group.beads, j.group.glass]) { m.position.set(p.x, p.y, 0); m.scale.setScalar(p.scale); m.updateMatrixWorld(); }
      (j.group.glass.material as ShaderMaterial).uniforms.uRefract.value.set((JAR.refract * p.px) / Math.max(1, view.w), (JAR.refract * p.px) / Math.max(1, view.h));
    }
  }
  function draw(fog: Texture | null, flat: boolean, target: WebGLRenderTarget, mid: WebGLRenderTarget, c: PerspectiveCamera) {
    const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping; renderer.setClearColor(0x000000, 1);
    copyU.uRes.value.set(mid.width, mid.height); copyU.tMap.value = fog; copyU.uUseFlat.value = flat || !fog ? 1 : 0;
    renderer.setRenderTarget(mid); renderer.clear(); renderer.render(sceneA, c);
    copyU.tMap.value = mid.texture; copyU.uUseFlat.value = 0; glassShared.tFrame.value = mid.texture; glassShared.uRes.value.set(target.width, target.height);
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(sceneB, c);
    renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
  }

  const inView = () => { current(); if (!Number.isFinite(top)) return false; const rTop = top - scrollY; return rTop < innerHeight && rTop + height > 0; };

  const api: JarsScene & SignupIsland = {
    mark: SIGNUP_MARK,
    get ready() { return ready; },
    get failed() { return failed; },
    step(f) {
      lastT = f.t;
      const on = ready && !disposed && (f.wipe > 0 || inView());
      window.__skreedSignupFrame?.({ on, cover: f.cover, wipe: f.wipe } satisfies SignupFrame);
      if (!on) return { on: false, tex: null };
      current();
      for (const j of jars) if (j.t0 >= 0) { j.level = levelAt(j.from, j.to, j.t0, f.t, FILL_MS, reduced); if (j.level === j.to) j.t0 = -1; (j.group.beads.material as ShaderMaterial).uniforms.uLevel.value = j.level; }
      const sy = scrollY;
      cam.aspect = cssW / Math.max(1, cssH); cam.updateProjectionMatrix();
      place({ w: cssW, h: cssH }, sy);
      draw(o.fog(), false, rtB, rtA, cam);
      return { on: true, tex: rtB.texture };
    },
    async load() {
      if (ready || failed || disposed) return;
      try {
        const [p] = await fetchProductsBin(JAR_BIN_URL, ac.signal);
        if (disposed) return;
        if (!p || !p.parts.length) throw new Error('jar.bin: no jar');
        jarGeo = p.parts[0].geometry;
        const defs = [...SIGNUP_FOLLOWS.map((j) => ({ id: j.id, level: jarLevel(j) })), { id: 'yours', level: 0 }];
        defs.forEach((d, k) => { jars.push(buildJar(d, 11 + k * 7)); });
        order = domFollows();   // the DOM as it stands now: the DOM script may have marked the saved follows since this chunk was made
        for (const j of jars) colour(j, order);
        const y = jars.find((j) => j.id === 'yours');
        if (y) { y.level = y.from = y.to = yoursLevelOf(order); (y.group.beads.material as ShaderMaterial).uniforms.uLevel.value = y.level; }
        // the programs, one a frame, with a target bound (three keys each program on the target)
        if (!warmed) {
          warmed = true;
          for (const j of jars) { j.group.beads.visible = true; j.group.glass.visible = true; }
          await compile(copyScene, fsCam, rtA); await frame(); if (disposed) return;
          await compile(sceneA, cam, rtA); await frame(); if (disposed) return;
          await compile(sceneB, cam, rtB); await frame(); if (disposed) return;
        }
        ready = true;
      } catch (e) {
        if (disposed) return;
        failed = true;
        console.warn('section 5: jar.bin did not load; the section stands as text', e);
        root.dataset.tier = 'poster';
      }
    },
    resize(w, h) {
      W = Math.max(1, w); H8 = Math.max(1, h); cssW = W / dpr; cssH = H8 / dpr;
      rtA.setSize(W, H8); rtB.setSize(W, H8);
      lay.measure();
    },
    exitY() { current(); return Number.isFinite(bodyBottom) ? bodyBottom - innerHeight : NaN; },
    restY() { current(); const e = api.exitY(); return Number.isFinite(e) ? Math.max(top, e) : NaN; },
    inView,
    pour(id) { if (!order.includes(id)) order = [...order, id]; onSignup(new CustomEvent('skreed:signup', { detail: { id, follows: order } })); },
    follows(ids) {
      order = ids.filter((id) => jarById(id));
      const y = jars.find((j) => j.id === 'yours');
      if (!y) return;
      colour(y, order); y.level = y.from = y.to = yoursLevelOf(order); y.t0 = -1; (y.group.beads.material as ShaderMaterial).uniforms.uLevel.value = y.level;
    },
    async still(id, level) {
      if (!ready || disposed) return null;
      const j = jars.find((x) => x.id === id);
      if (!j) return null;
      const w = 320, h = 400, c = new PerspectiveCamera(JAR.fovDeg, w / h, 0.1, 100);
      c.position.set(0, 0, JAR.distance); c.lookAt(0, 0, 0); c.updateMatrixWorld(); c.updateProjectionMatrix();
      const mid = new WebGLRenderTarget(w, h, { depthBuffer: true }), out = new WebGLRenderTarget(w, h, { depthBuffer: true });
      const was = { level: j.level, vis: jars.map((x) => [x.group.beads.visible, x.group.glass.visible] as const) };
      try {
        for (const x of jars) x.group.beads.visible = x.group.glass.visible = x === j;
        const p = placeJar({ x: 0, y: 0, w, h }, { w, h });
        for (const m of [j.group.beads, j.group.glass]) { m.position.set(p.x, p.y, 0); m.scale.setScalar(p.scale); m.updateMatrixWorld(); }
        (j.group.glass.material as ShaderMaterial).uniforms.uRefract.value.set((JAR.refract * p.px) / w, (JAR.refract * p.px) / h);
        if (level !== undefined) (j.group.beads.material as ShaderMaterial).uniforms.uLevel.value = level;
        draw(null, true, out, mid, c);
        const data = new Uint8Array(w * h * 4);
        renderer.readRenderTargetPixels(out, 0, 0, w, h, data);
        return { width: w, height: h, data };
      } finally {
        (j.group.beads.material as ShaderMaterial).uniforms.uLevel.value = was.level;
        jars.forEach((x, k) => { x.group.beads.visible = was.vis[k][0]; x.group.glass.visible = was.vis[k][1]; });
        mid.dispose(); out.dispose();
      }
    },
    hooks() {
      return { ready, failed, order: [...order], levels: Object.fromEntries(jars.map((j) => [j.id, +j.level.toFixed(3)])), filling: jars.filter((j) => j.t0 >= 0).map((j) => j.id), layout: lay.layout ? { ...lay.layout, bodyBottom } : null, slots: Object.fromEntries([...slotRects].map(([k, v]) => [k, { ...v }])), placed: Object.fromEntries(jars.filter((j) => j.placement).map((j) => [j.id, { ...j.placement!, slot: j.slot }])) };
    },
    dispose() {
      disposed = true; ac.abort();
      removeEventListener('skreed:signup', onSignup);
      lay.dispose();
      rtA.dispose(); rtB.dispose(); copyMat.dispose(); fsGeo.dispose(); pellet.dispose(); jarGeo?.dispose();
      for (const j of jars) { j.geo.dispose(); (j.group.beads.material as ShaderMaterial).dispose(); (j.group.glass.material as ShaderMaterial).dispose(); }
      if (window.__skreedSignup === api) window.__skreedSignup = undefined;
    },
  };
  window.__skreedSignup = api;
  return api;
}
