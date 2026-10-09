// The family page's 3D stage (docs/specs/family-page.md 2.5; case-model-class.md 11): renderer, camera rule,
// environment and key light, the conveyor lineup, inputs, render on demand, the tier probe, context loss and disposal.
// The same stage runs the supplier model (PUBLIC_FAMILY_3D=on) and the stand-in (dev); the light levels come from
// calibration.json and the lineup constants from pose.ts (the supplier's tuning, run 2).
import {
  AmbientLight, DirectionalLight, Matrix4, NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3,
  WebGLRenderer, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CaseLineup } from './case-lineup.ts';
import type { CaseAsset } from './case-asset.ts';
import { cameraAt, derive, lineupFor, pose, solveFraming, type FrontFx, type LineupParams, type Layout } from './pose.ts';
import { disposeFinishMaterials, type Tier } from './finish-materials.ts';
import { CANVAS_FADE_MS, LINEUP_RATE, TURN_MS, TURN_EASE } from '../timing.ts';
import type { Finish, Input } from '../bus.ts';
import CAL from './calibration.json' with { type: 'json' };
import { SOFTWARE_GL } from './gl-check.ts';

const WIDE_MQ = '(min-width: 900px) and (min-height: 600px)';
const AXIS_LOCK_PX = 6, TAP_SLOP_PX = 10, AFTER_DRAG_MS = 100, FLING_S = 0.2, VEL_WINDOW_MS = 80, RUBBER = 0.35;
const TILT_YAW = 5, TILT_X = 3, TURN_DEG = 10;
/** Calibration B's light levels (case-model-class.md 10), written by scripts/case-model/calibrate.mjs. */
const ENV_INTENSITY = CAL.environmentIntensity, KEY_INTENSITY = CAL.keyIntensity, AMBIENT_INTENSITY = CAL.ambientIntensity ?? 0;
const [KX, KY, KZ] = CAL.keyPosition;

export class StageError extends Error {
  readonly reason: 'webgl' | 'software' | 'context';
  constructor(reason: 'webgl' | 'software' | 'context', msg?: string) { super(msg ?? reason); this.reason = reason; }
}

export interface StageOptions {
  shades: readonly { hex: string }[];
  selected: number;
  finish: Finish;
  /** reduced motion under the still3d tier: every change instant, no entrance, tilt or turn */
  still: boolean;
  /** tests: allow a software renderer (SwiftShader) */
  force: boolean;
  /** the visitor tapped or dragged to a case */
  onPick: (i: number, input: Input, dragging: boolean) => void;
  onLive: () => void;
  /** a second context loss: the page moves to swatch grid mode */
  onLost: () => void;
  /** the model's lineup tuning (pose.ts SUPPLIER_TUNING for the supplier case; none for the stand-in) */
  tuning?: Partial<LineupParams>;
  /** tests only (hook builds): skip the probe and take this tier */
  tier?: Tier;
  /** tests and the poster renderer only (hook builds): hold frame 0, the poster pose (no converge) */
  hold?: boolean;
}

export interface ProbeResult { period: number; median: number; gpu: boolean; tier: Tier | 'grid'; runs: number }

/** A cubic-bezier easing, solved for x by Newton steps (the CSS curve of --ease-turn). */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1, b = (p1: number, p2: number) => 3 * p2 - 6 * p1, c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => { let t = x; for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (at(t, x1, x2) - x) / s; } return at(Math.min(1, Math.max(0, t)), y1, y2); };
}
const easeTurn = bezier(...TURN_EASE);

export class Stage {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera();
  readonly lineup: CaseLineup;
  private env: WebGLRenderTarget | null = null;
  private key = new DirectionalLight(0xffffff, KEY_INTENSITY);
  /** an even fill that reaches every case alike, so the fanned row reads at its swatch colour as the front case does */
  private fill = new AmbientLight(0xffffff, AMBIENT_INTENSITY);
  private P!: LineupParams;
  private K!: ReturnType<typeof derive>;
  private dims: { w: number; d: number };
  private tier: Tier = 'high';
  private started = false;
  probeResult: ProbeResult | null = null;
  private W = 1; private H = 1; private pxu = 170; private layout: Layout = 'phone';
  private s: number; private target: number; private G = 0;
  private tilt = { yaw: 0, x: 0, tyaw: 0, tx: 0 };
  private turn = { t0: -1, side: 1 };
  private fx: FrontFx = { yaw: 0, tilt: 0 };
  private liveT = 0;
  private raf = 0; private last = 0; private tail = 0; private visible = true; private shown = false; private losses = 0;
  private drag = { id: -1, x0: 0, y0: 0, s0: 0, lock: '' as '' | 'x' | 'y', moved: 0, endT: 0, samples: [] as { t: number; x: number }[], lastSlot: -1 };
  private hoverPending: PointerEvent | null = null;
  private ray = new Raycaster(); private ndc = new Vector2();
  private m = new Matrix4();
  private off: (() => void)[] = [];
  private poseFn = (slot: number, out: Matrix4) => { pose(slot, this.s, this.G, this.P, this.K, out, this.fx); };

  readonly host: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private o: StageOptions;

  constructor(host: HTMLElement, canvas: HTMLCanvasElement, asset: CaseAsset, o: StageOptions) {
    this.host = host; this.canvas = canvas; this.o = o;
    let r: WebGLRenderer;
    try {
      r = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default', failIfMajorPerformanceCaveat: !o.force });
    } catch (e) { throw new StageError('webgl', String(e)); }
    const gl = r.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (!o.force && SOFTWARE_GL.test(name)) { r.dispose(); throw new StageError('software', name); }
    this.renderer = r;
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1;
    r.setClearColor(0x000000, 0);
    this.makeEnvironment();
    this.key.position.set(KX, KY, KZ);
    this.scene.add(this.key);
    if (AMBIENT_INTENSITY > 0) this.scene.add(this.fill);
    this.dims = { w: asset.dims.w, d: asset.dims.d };
    this.setParams(matchMedia(WIDE_MQ).matches ? 'wide' : 'phone');
    this.lineup = new CaseLineup(asset, 24, { tier: 'high' });
    this.lineup.setShades(o.shades);
    this.lineup.setFinish(o.finish);
    this.scene.add(this.lineup.object);
    this.target = o.selected;
    // frame 0 is the poster pose: no case promoted, centred on the middle of the family (decision 17)
    this.s = o.still ? o.selected : 11.5;
    this.G = o.still ? 1 : 0;
    this.listen();
    this.resize();
  }

  private makeEnvironment(): void {
    const pm = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.env = pm.fromScene(room, 0.04);
    pm.dispose();
    room.dispose();
    this.scene.environment = this.env.texture;
    this.scene.environmentIntensity = ENV_INTENSITY;
  }

  private setParams(layout: Layout): void {
    this.P = lineupFor(this.dims, layout, this.o.tuning);
    this.K = derive(this.P);
  }

  // ---- layout: the camera rule by layout class, re-solved on every stage resize ----
  resize(): void {
    const r = this.host.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    const layout: Layout = matchMedia(WIDE_MQ).matches ? 'wide' : 'phone';
    const coarse = matchMedia('(pointer: coarse)').matches;
    // DPR cap: 2 on the phone layout or a coarse pointer, 1.5 on the wide layout with a fine pointer, 1 at the low tier
    const dpr = Math.min(devicePixelRatio || 1, this.tier === 'low' ? 1 : layout === 'phone' || coarse ? 2 : 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(W, H, false);
    if (W !== this.W || H !== this.H || layout !== this.layout) {
      if (layout !== this.layout) this.setParams(layout);
      this.W = W; this.H = H; this.layout = layout;
      const f = solveFraming(W, H, layout, this.P);
      this.pxu = f.pxu;
      cameraAt(W, H, f.D, this.P, true, this.camera);
      this.camera.setViewOffset(W, H, 0, -f.shiftY, W, H);
    }
    if (this.started) this.kick();
  }

  // ---- the tier probe (family-page.md 2.5 "Tiers"): runs once the model and the PMREM are ready, canvas still hidden ----
  /**
   * 10 animation frames with no rendering give the display period P; then 20 forced renders of the poster pose, timed
   * by EXT_disjoint_timer_query_webgl2 where it exists, otherwise by the render plus a one-pixel read (a plain rAF
   * interval hides the GPU's cost, which runs in another process). High: median 1.25 P or less (GPU
   * time 0.75 P or less). Otherwise low (DPR 1, LOD1 front, Standard gloss) and the probe runs again; a median over
   * 3 P sends the page to swatch grid mode.
   */
  async probe(): Promise<ProbeResult> {
    const raf = () => new Promise<number>((r) => requestAnimationFrame(r));
    const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : Infinity; };
    let prev = await raf(), P = Infinity;
    for (let i = 0; i < 10; i++) { const t = await raf(); P = Math.min(P, t - prev); prev = t; }
    if (!Number.isFinite(P) || P <= 0) P = 16.7;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const run = async (): Promise<{ med: number; gpu: boolean }> => {
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
      const queries: WebGLQuery[] = [], cpu: number[] = [], px = new Uint8Array(4);
      await raf();
      for (let i = 0; i < 20; i++) {
        const q = ext ? gl.createQuery() : null;
        if (q && ext) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
        const t0 = performance.now();
        this.draw();
        if (q && ext) { gl.endQuery(ext.TIME_ELAPSED_EXT); queries.push(q); }
        // a one-pixel read waits for the frame, so the time is the render's real cost, not just its submission
        // (the GPU runs in another process and a plain rAF interval hides its cost)
        else gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        cpu.push(performance.now() - t0);
        await raf();
      }
      if (ext && queries.length) {
        for (let k = 0; k < 10 && !gl.getQueryParameter(queries[queries.length - 1], gl.QUERY_RESULT_AVAILABLE); k++) await raf();
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        const ns = queries.filter((q) => gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)).map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) as number);
        queries.forEach((q) => gl.deleteQuery(q));
        if (!disjoint && ns.length >= 10) return { med: median(ns) / 1e6, gpu: true };
      }
      return { med: median(cpu), gpu: false };
    };
    let r = await run(), runs = 1;
    let tier: Tier | 'grid' = (r.gpu ? r.med <= 0.75 * P : r.med <= 1.25 * P) ? 'high' : 'low';
    if (tier === 'low') {
      this.setTier('low');
      r = await run(); runs++;
      if (r.med > 3 * P) tier = 'grid';
    }
    this.probeResult = { period: P, median: r.med, gpu: r.gpu, tier, runs };
    return this.probeResult;
  }

  /** Low tier: DPR 1, the front case back at LOD1, gloss without clearcoat. */
  setTier(t: Tier): void {
    this.tier = t;
    this.lineup.setTier(t);
    this.W = 0;
    this.resize();
  }
  getTier(): Tier { return this.tier; }

  /** Shows the canvas: probe first (or the test's forced tier), then the first live frame. Resolves with the verdict. */
  async start(): Promise<Tier | 'grid'> {
    let verdict: Tier | 'grid';
    if (this.o.tier) { if (this.o.tier === 'low') this.setTier('low'); verdict = this.o.tier; }
    else verdict = (await this.probe()).tier;
    if (verdict === 'grid' && this.o.force) verdict = 'low';     // tests on SwiftShader keep the 3D at the low tier
    if (verdict === 'grid') return verdict;
    this.started = true;
    this.kick();
    return verdict;
  }

  // ---- selection ----
  setTarget(i: number, instant: boolean): void {
    this.target = Math.max(0, Math.min(23, i));
    if (instant || this.o.still) this.s = this.target;
    this.kick();
  }
  setFinish(f: Finish): void {
    this.lineup.setFinish(f);
    this.startTurn(1);
  }
  private startTurn(side: number): void {
    if (this.o.still) { this.kick(); return; }
    this.turn = { t0: performance.now(), side };
    this.kick();
  }

  // ---- the loop: render on demand, stop when settled ----
  kick(): void {
    if (!this.started) return;
    this.tail = 2;
    if (!this.raf && this.visible) { this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  }
  private frame = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const k = 1 - Math.exp(-LINEUP_RATE * dt);
    if (this.drag.lock !== 'x' && !this.o.hold) this.s += (this.target - this.s) * k;
    if (!this.o.hold) this.G += (1 - this.G) * k;
    this.tilt.yaw += (this.tilt.tyaw - this.tilt.yaw) * k;
    this.tilt.x += (this.tilt.tx - this.tilt.x) * k;
    let turnYaw = 0, turning = false;
    if (this.turn.t0 >= 0) {
      const u = (now - this.turn.t0) / TURN_MS;
      if (u >= 1) this.turn.t0 = -1;
      else { turning = true; turnYaw = TURN_DEG * this.turn.side * (u < 0.5 ? easeTurn(u * 2) : 1 - easeTurn((u - 0.5) * 2)); }
    }
    this.fx.yaw = this.tilt.yaw + turnYaw;
    this.fx.tilt = this.tilt.x;
    const settled = this.o.hold || this.drag.lock !== 'x' && Math.abs(this.target - this.s) < 0.0005 && 1 - this.G < 0.0005 && Math.abs(this.tilt.tyaw - this.tilt.yaw) < 0.01 && Math.abs(this.tilt.tx - this.tilt.x) < 0.01 && !turning;
    if (settled && !this.o.hold) { this.s = this.target; this.G = 1; }
    this.render();
    if (!settled) this.tail = 2;
    if (this.tail-- > 0 && this.visible) this.raf = requestAnimationFrame(this.frame);
  };
  /** One frame of the current state, without showing the canvas (the probe, tests). */
  draw(): void {
    const r = Math.round(this.s);
    this.lineup.setPoses(this.poseFn, [r, this.s >= r ? r + 1 : r - 1]);
    this.renderer.render(this.scene, this.camera);
  }
  render(): void {
    this.draw();
    if (!this.shown && this.started) {
      this.shown = true;
      this.canvas.classList.add('on');
      // the poster under the canvas hides once the canvas has faded in (an empty stage shows the page neutral)
      clearTimeout(this.liveT);
      this.liveT = window.setTimeout(() => { if (this.shown) this.host.classList.add('live'); }, this.o.still ? 0 : CANVAS_FADE_MS);
      this.o.onLive();
    }
  }
  /** LOD0 arrived after a high verdict: the front pair switches with no visible change in size or place. */
  setDetail(parts: Parameters<CaseLineup['setDetail']>[0]): void { this.lineup.setDetail(parts); this.kick(); }

  // ---- input (2.5 "Inputs"): drag on every pointer type, tap or click to select, the front case turns ----
  private stripPx(): number { return this.K.pitch * this.pxu; }
  private slotAt(clientX: number, clientY: number): number | null {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.lineup.pick(this.ray);
  }
  private listen(): void {
    const c = this.canvas;
    const add = <T extends Event>(el: EventTarget, type: string, fn: (e: T) => void, opts?: AddEventListenerOptions) => { el.addEventListener(type, fn as EventListener, opts); this.off.push(() => el.removeEventListener(type, fn as EventListener, opts)); };
    add<PointerEvent>(c, 'pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const d = this.drag;
      d.id = e.pointerId; d.x0 = e.clientX; d.y0 = e.clientY; d.s0 = this.s; d.lock = ''; d.moved = 0; d.samples = [{ t: e.timeStamp, x: e.clientX }]; d.lastSlot = Math.round(this.target);
    });
    add<PointerEvent>(c, 'pointermove', (e) => {
      const d = this.drag;
      if (e.pointerId === d.id) {
        const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
        d.moved = Math.max(d.moved, Math.hypot(dx, dy));
        if (!d.lock && (Math.abs(dx) > AXIS_LOCK_PX || Math.abs(dy) > AXIS_LOCK_PX)) {
          d.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (d.lock === 'x') { c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; this.tilt.tyaw = 0; this.tilt.tx = 0; }
        }
        if (d.lock === 'x') {
          d.samples.push({ t: e.timeStamp, x: e.clientX });
          while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > VEL_WINDOW_MS) d.samples.shift();
          let t = d.s0 - dx / this.stripPx();
          if (t < 0) t *= RUBBER; else if (t > 23) t = 23 + (t - 23) * RUBBER;   // past the ends the line resists
          this.s = t;
          this.target = Math.max(0, Math.min(23, t));
          const slot = Math.round(this.target);
          if (slot !== d.lastSlot) { d.lastSlot = slot; this.o.onPick(slot, 'drag', true); }
          this.kick();
        }
        return;
      }
      if (e.pointerType === 'mouse' && matchMedia('(pointer: fine)').matches) this.hover(e);
    });
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (e.pointerId !== d.id) return;
      d.id = -1;
      if (d.lock === 'x') {
        const a = d.samples[0], b = d.samples[d.samples.length - 1];
        const v = b && a && b.t > a.t ? (b.x - a.x) / ((b.t - a.t) / 1000) : 0;   // px per second
        const fling = this.o.still ? 0 : (v * FLING_S) / this.stripPx();
        this.target = Math.max(0, Math.min(23, Math.round(this.s - fling)));
        if (this.o.still) this.s = this.target;
        d.endT = performance.now();
        c.style.cursor = '';
        this.o.onPick(this.target, 'drag', false);
      }
      d.lock = '';
      this.kick();
    };
    add<PointerEvent>(c, 'pointerup', end);
    add<PointerEvent>(c, 'pointercancel', end);
    add<MouseEvent>(c, 'click', (e) => {
      if (e.target !== c || this.drag.moved > TAP_SLOP_PX || performance.now() - this.drag.endT < AFTER_DRAG_MS) return;
      const slot = this.slotAt(e.clientX, e.clientY);
      if (slot === null) return;
      if (slot === Math.round(this.target)) {
        const p = new Vector3().setFromMatrixPosition((this.poseFn(slot, this.m), this.m)).project(this.camera);
        const r = c.getBoundingClientRect();
        this.startTurn(e.clientX >= r.left + (p.x + 1) / 2 * r.width ? 1 : -1);
        return;
      }
      this.setTarget(slot, false);
      this.o.onPick(slot, 'tap', false);
    });
    add<PointerEvent>(c, 'pointerleave', () => { this.tilt.tyaw = 0; this.tilt.tx = 0; c.style.cursor = ''; this.kick(); });
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.host);
    this.off.push(() => ro.disconnect());
    const io = new IntersectionObserver(([en]) => { this.visible = en.isIntersecting && !document.hidden; if (this.visible) this.kick(); });
    io.observe(this.host);
    this.off.push(() => io.disconnect());
    add(document, 'visibilitychange', () => { this.visible = !document.hidden; if (this.visible) this.kick(); });
    add<Event>(c, 'webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(this.raf); this.raf = 0; clearTimeout(this.liveT); c.classList.remove('on'); this.host.classList.remove('live'); this.shown = false; if (++this.losses > 1) this.o.onLost(); });
    add(c, 'webglcontextrestored', () => { if (this.losses > 1) return; this.makeEnvironment(); this.W = 0; this.resize(); void this.warmUp(); });
  }
  private hover(e: PointerEvent): void {
    const first = !this.hoverPending;
    this.hoverPending = e;
    if (!first) return;
    requestAnimationFrame(() => {
      const ev = this.hoverPending!;
      this.hoverPending = null;
      const slot = this.slotAt(ev.clientX, ev.clientY);
      this.canvas.style.cursor = slot === null ? '' : 'pointer';
      if (this.o.still) return;
      const r = this.host.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      this.tilt.tyaw = TILT_YAW * nx;
      this.tilt.tx = TILT_X * ny;
      this.kick();
    });
  }

  /** Compiles the other finish's program in idle time after the first live frame (T15). */
  warmUp(): Promise<number> { return this.lineup.warmUp(this.renderer, this.scene, this.camera); }

  /**
   * Tests only: the rendered silhouette of one case (client px), drawn alone in the current pose and read back in the
   * same task, so acceptance 3 and 4 measure real pixels rather than projected boxes. Null when it has no pixel.
   */
  slotBox(slot: number): { x0: number; x1: number; y0: number; y1: number } | null {
    const gl = this.renderer.getContext();
    this.lineup.only = slot;
    this.draw();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    this.lineup.only = null;
    this.draw();
    let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const r = this.canvas.getBoundingClientRect(), k = r.width / w;
    return { x0: r.left + x0 * k, x1: r.left + (x1 + 1) * k, y0: r.top + (h - 1 - y1) * k, y1: r.top + (h - y0) * k };
  }

  /** The screen position (client px) of a slot's case centre, for tests and DOM hit boxes. */
  project(slot: number): { x: number; y: number } {
    this.poseFn(slot, this.m);
    const p = new Vector3().setFromMatrixPosition(this.m).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }
  state() { return { s: this.s, target: this.target, G: this.G, layout: this.layout, pxu: this.pxu, W: this.W, H: this.H, running: this.raf !== 0, tier: this.tier, P: this.P }; }
  /** The slot under a client point (the same pick the click uses). */
  pickAt(clientX: number, clientY: number): number | null { return this.slotAt(clientX, clientY); }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.liveT);
    this.host.classList.remove('live');
    this.off.forEach((f) => f());
    this.lineup.dispose();
    disposeFinishMaterials();
    this.env?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
