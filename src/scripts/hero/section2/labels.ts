// igloo's labels (prototype v11.4 template.html, section 2 "labels"; section-2.md 3 and 5 "Labels"): each gem carries
// its family's name in the singular, uppercase, in IBM Plex Mono Medium (E-S2-font); the active gem adds igloo's date slot
// as "24 SHADES" over the call to action. Reveal measured on igloo: leader 0.2 s, left-to-right alpha wipe 0.4 s, glyph
// roll 0.75 s (each letter counts down through the five glyphs after it in its 8-glyph block); hide 0.2 s, leader
// retracting horizontal segment first, alpha wiping right to left. igloo draws its white labels straight on the fog
// (about 2.5:1, E-S2-contrast); darkened plates read as grey boxes, so they are off (PLATES false).
import { Box3, Vector3 as V3, type BufferGeometry, type Camera, type Group, type Mesh } from 'three';
import { LONG } from './gemGeometry.ts';

export interface Label { el: HTMLDivElement; chars: { s: HTMLSpanElement; ch: string; shown: string; a: number; a0: number }[]; lead: SVGPolylineElement | null; kind: 'title' | 'cta' | 'temp'; on: boolean; t0: number; settled: boolean; hidden: boolean; lp: number; plate: number; w: number; h: number; side: string | null; x: number; y: number }
export interface LabelStone { j: number; group: Group; mesh: Mesh; geo: BufferGeometry; rest: THREE_Q; slot: { u: number; v: number; s: number; side: string }; base: V3; labs: { title: Label; cta: Label }; viewBB: Box3; anch: Record<string, V3>; L: number }
type THREE_Q = import('three').Quaternion;
interface Geo { pts: number[][] | null; x: number; y: number; right: boolean }

export interface LabelsEnv { camera: Camera; vp: { cssW: number; cssH: number; PHONE: boolean; LAB_PX: number }; reduce: boolean; touch: boolean; layer: HTMLElement; svg: SVGSVGElement; names: readonly string[]; cta: readonly [string, string] }

const PLATES = false;
const roll = (ch: string, k: number) => { const c = ch.charCodeAt(0); if (c <= 32 || !k) return ch; const b = c & ~7; return String.fromCharCode(b + ((c - b + k) % 8)); };

export function createLabels(env: LabelsEnv) {
  const { camera, vp, layer: labLayer, svg } = env, REDUCE = env.reduce;
  const vP = new V3();
  function makeLabel(lines: string[], kind: Label['kind']): Label {
    const el = document.createElement('div'); el.className = 's2lab'; const chars: Label['chars'] = [];
    for (const ln of lines) { const row = document.createElement('div');
      for (const ch of ln) { const s = document.createElement('span'); s.textContent = ch; s.style.opacity = '0'; row.appendChild(s); chars.push({ s, ch, shown: ch, a: 0, a0: 0 }); }
      el.appendChild(row); }
    labLayer.appendChild(el);
    let lead: SVGPolylineElement | null = null;
    if (kind !== 'temp') { lead = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); lead.setAttribute('fill', 'none'); lead.setAttribute('stroke', '#F7F6F3'); lead.setAttribute('stroke-width', '1'); svg.appendChild(lead); }
    return { el, chars, lead, kind, on: false, t0: -1e9, settled: true, hidden: true, lp: 0, plate: 0, w: 0, h: 0, side: null, x: 0, y: 0 };
  }
  function setOn(L: Label, on: boolean, now: number, delay = 0) {
    if (L.on === on) return;
    L.on = on; L.t0 = now + delay; L.settled = false; L.hidden = false;
    if (!on) for (const c of L.chars) c.a0 = c.a;
  }
  function animLabel(L: Label, now: number) {
    if (L.on ? L.settled : L.hidden) return;
    const t = Math.max(0, (now - L.t0) / 1000), n = L.chars.length, xs = (i: number) => (n > 1 ? i / (n - 1) : 0);
    const put = (c: Label['chars'][number], a: number) => { if (Math.abs(a - c.a) > 1e-3 || a === 0 || a === 1) { c.a = a; c.s.style.opacity = a.toFixed(3); } };
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
  function anchorObj(st: LabelStone, fx: number, fy: number, fz: number): V3 {
    const b = st.viewBB, p = new V3(b.min.x + (b.max.x - b.min.x) * fx, b.min.y + (b.max.y - b.min.y) * fy, b.min.z + (b.max.z - b.min.z) * fz);
    return p.applyQuaternion(st.rest.clone().invert());
  }
  const toPx = (p: V3): [number, number] => { vP.copy(p).project(camera); return [(vP.x * 0.5 + 0.5) * vp.cssW, (0.5 - vP.y * 0.5) * vp.cssH]; };
  const projA = (st: LabelStone, key: string) => toPx(vP.copy(st.anch[key]).applyMatrix4(st.mesh.matrixWorld));
  function labelGeo(st: LabelStone, L: Label, side: string): Geo {
    const w = L.w, h = L.h, em = vp.LAB_PX, ppu = st.slot.s / LONG;
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
  const rectOf = (g: Geo, L: Label) => [g.x - 1.2 * vp.LAB_PX, g.y - 6, g.x + L.w + 1.2 * vp.LAB_PX, g.y + L.h + 6];
  const overlap = (a: number[], b: number[]) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  function gemBox(st: LabelStone): [number, number, number, number] {
    const bb = st.geo.boundingBox!, r = [1e9, 1e9, -1e9, -1e9];
    for (let c = 0; c < 8; c++) { const p = new V3(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).applyMatrix4(st.mesh.matrixWorld);
      const [x, y] = toPx(p); r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x); r[3] = Math.max(r[3], y); }
    const sh = 0.12 * (r[2] - r[0]), sv = 0.12 * (r[3] - r[1]); return [r[0] + sh, r[1] + sv, r[2] - sh, r[3] - sv];
  }
  const GUT = 16;
  function badness(rect: number[], j: number, boxes: number[][], placed: number[][]) {
    let b = 0;
    if (rect[0] < GUT) b += (GUT - rect[0]) * 400; if (rect[2] > vp.cssW - GUT) b += (rect[2] - vp.cssW + GUT) * 400;
    if (rect[1] < 8) b += (8 - rect[1]) * 400; if (rect[3] > vp.cssH - 8) b += (rect[3] - vp.cssH + 8) * 400;
    boxes.forEach((bx, q) => { if (q !== j) b += overlap(rect, bx) * 4; });
    for (const p of placed) b += overlap(rect, p) * 8;
    return b;
  }
  // titles are placed once per layout (stable, no flicker); the extra labels of the active stone pick their side when shown
  function layoutTitles(stones: LabelStone[]) {
    const boxes = stones.map(gemBox), placed: number[][] = [];
    stones.forEach((st, j) => {
      const L = st.labs.title, left = st.slot.u < 0.5;
      const order = vp.PHONE ? (left ? ['r', 'l', 'ur', 'ul'] : ['l', 'r', 'ul', 'ur']) : ['ul', 'ur', 'r', 'l'];
      let best: string | null = null, bs = 1e18;
      for (const side of order) { const r = rectOf(labelGeo(st, L, side), L), b = badness(r, j, boxes, placed); if (b < bs - 1e-6) { bs = b; best = side; } if (b === 0) break; }
      L.side = best; placed.push(rectOf(labelGeo(st, L, best!), L));
    });
  }
  function sideFor(stones: LabelStone[], st: LabelStone, L: Label) {
    const j = stones.indexOf(st), boxes = stones.map(gemBox), placed = stones.filter((s) => s !== st).map((s) => rectOf(labelGeo(s, s.labs.title, s.labs.title.side!), s.labs.title));
    let best = 'r', bs = 1e18; for (const side of ['r', 'l']) { const b = badness(rectOf(labelGeo(st, L, side), L), j, boxes, placed); if (b < bs) { bs = b; best = side; } } return best;
  }
  function drawLeader(L: Label, g: Geo) {
    if (!L.lead) return;
    if (L.lp <= 0 || !g.pts) { L.lead.setAttribute('points', ''); return; }
    const [A, P1, P2] = g.pts, a = Math.min(1, L.lp / 0.5), b = Math.max(0, Math.min(1, (L.lp - 0.5) / 0.5));
    const q1 = [A[0] + (P1[0] - A[0]) * a, A[1] + (P1[1] - A[1]) * a];
    let s = `${A[0].toFixed(1)},${A[1].toFixed(1)} ${q1[0].toFixed(1)},${q1[1].toFixed(1)}`;
    if (b > 0) s += ` ${(P1[0] + (P2[0] - P1[0]) * b).toFixed(1)},${(P1[1] + (P2[1] - P1[1]) * b).toFixed(1)}`;
    L.lead.setAttribute('points', s);
  }
  function build(stones: LabelStone[]) {
    for (const st of stones) {
      const j = st.j;
      st.labs = { title: makeLabel([env.names[j].toUpperCase()], 'title'), cta: makeLabel([env.cta[0], env.cta[1]], 'cta') };
      for (const L of Object.values(st.labs)) { const r = L.el.getBoundingClientRect(); L.w = r.width; L.h = r.height; }
      const p: V3[] = []; const a = st.geo.getAttribute('position').array; for (let i = 0; i < a.length; i += 3) p.push(new V3(a[i], a[i + 1], a[i + 2]).applyQuaternion(st.rest));
      st.viewBB = new Box3().setFromPoints(p);
      st.anch = { titleL: anchorObj(st, 0.35, 0.85, 0.93), titleR: anchorObj(st, 0.65, 0.85, 0.93), sideL: anchorObj(st, 0.08, 0.55, 0.9), sideR: anchorObj(st, 0.92, 0.55, 0.9),
        temp: anchorObj(st, 0.70, 0.85, 0.93), tempL: anchorObj(st, 0.30, 0.85, 0.93), cta: anchorObj(st, 0.70, 0.25, 0.95), ctaL: anchorObj(st, 0.30, 0.25, 0.95) };
    }
  }
  function measure(stones: LabelStone[]) { for (const st of stones) { const L = st.labs.title; const r = L.el.getBoundingClientRect(); L.w = r.width; L.h = r.height; } }
  function update(stones: LabelStone[], now: number, bg: { uLab: { value: Float32Array }; uLabA: { value: Float32Array }; uLabN: { value: number }; uLabFeather: { value: number } }, dpr: number) {
    const L4 = bg.uLab.value, LA = bg.uLabA.value, k = dpr; let n = 0;
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
    bg.uLabN.value = n; bg.uLabFeather.value = 12 * k;
  }
  function clear(stones: LabelStone[]) { for (const st of stones) if (st.labs) for (const L of Object.values(st.labs)) { L.el.remove(); L.lead?.remove(); } }
  return { setOn, gemBox, layoutTitles, sideFor, build, measure, update, clear };
}
export type Labels = ReturnType<typeof createLabels>;
