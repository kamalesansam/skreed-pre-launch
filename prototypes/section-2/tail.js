// test clock: ?vclock runs every timer on a virtual clock advanced by window.__tick(ms) (frame-exact captures)
const VCLOCK = Q.has('vclock'); let vNow = 0; const nowMs = () => (VCLOCK ? vNow : performance.now()); window.__tick = (ms) => { vNow += ms; return vNow; };
// ---------------------------------------------------------------- labels: igloo's three labels per stone, igloo's face and reveal
// Sam, 2026-10-10: igloo's text and font. igloo's three slots carry our facts: the title FAMILY_nn over the family, the
// "temp" slot the key shade's name, catalog number and hex, the date slot the shade count over the call to action.
// IBM Plex Mono Medium (SIL OFL), uppercase, Pearl Whisper. Reveal measured on igloo: leader 0.2 s, left-to-right alpha
// wipe 0.4 s, glyph roll 0.75 s (each letter counts down through the five glyphs after it in its 8-glyph block); hide
// 0.2 s, leader retracting horizontal segment first, alpha wiping right to left.
const FAM_ID = ['frosty-whites', 'blissful-blues', 'playful-pinks', 'vivid-violets', 'mellow-yellows', 'earthy-browns', 'blushing-corals', 'stormy-greys', 'go-green', 'roaring-reds'];
const KEYNO = [7, 32, 62, 79, 97, 127, 148, 173, 204, 223];
const LAB_PX = PHONE ? 12 : 13;
// igloo draws its white labels straight on the fog (about 2.5:1); darkened plates read as grey boxes, so they are off (Sam to sign off the contrast)
const PLATES = false;
const labLayer = document.getElementById('labels'), svg = document.getElementById('leaders'), linkLayer = document.getElementById('links');
const pad = (n, k) => String(n).padStart(k, '0');
const roll = (ch, k) => { const c = ch.charCodeAt(0); if (c <= 32 || !k) return ch; const b = c & ~7; return String.fromCharCode(b + ((c - b + k) % 8)); };
function makeLabel(lines, kind) {
  const el = document.createElement('div'); el.className = 'lab'; const chars = [];
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
const rectOf = (g, L) => [g.x - 4, g.y - 4, g.x + L.w + 4, g.y + L.h + 4];
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
    const j = st.j, sh = st.shade.toUpperCase(), hx = st.hex.toUpperCase();
    st.labs = { title: makeLabel([`FAMILY_${pad(j + 1, 2)}`, st.fam.toUpperCase()], 'title'),
      temp: makeLabel([`${sh} ${pad(KEYNO[j], 3)}`, hx], 'temp'),
      cta: makeLabel(['24 SHADES', PHONE ? 'TAP TO EXPLORE' : 'CLICK TO EXPLORE'], 'cta') };
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
    const a = document.createElement('a'); a.className = 'gem-link'; a.href = `#/shades/${FAM_ID[st.j]}/`; a.setAttribute('aria-label', `${st.fam}, 24 shades`);
    a.addEventListener('focus', () => { if (a.matches(':focus-visible')) setActive(j, 'focus'); });
    a.addEventListener('blur', () => { if (activeBy === 'focus') setActive(-1, ''); });
    linkLayer.appendChild(a); st.link = a;
  });
}
function placeLinks() {
  for (const st of stones) { const b = gemBox(st), w = Math.max(44, b[2] - b[0]), h = Math.max(44, b[3] - b[1]), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    st.link.style.width = `${w.toFixed(1)}px`; st.link.style.height = `${h.toFixed(1)}px`; st.link.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0)`; }
}

// ---------------------------------------------------------------- the active stone: igloo shows the date and temp labels and the plexus
// on the stone in the centre band; with ten stones on one screen, the stone under the pointer (or with keyboard focus) is that stone
let active = -1, activeBy = '';
function setActive(j, by) {
  if (j === active) { activeBy = by; return; }
  const now = nowMs();
  if (active >= 0) { const st = stones[active]; setOn(st.labs.temp, false, now); setOn(st.labs.cta, false, now); plexusOff(st, now); }
  active = j; activeBy = by;
  if (j >= 0) { const st = stones[j];
    st.labs.temp.side = sideFor(st, st.labs.temp); st.labs.cta.side = sideFor(st, st.labs.cta);
    setOn(st.labs.temp, true, now); setOn(st.labs.cta, true, now); if (!PHONE && !REDUCE) plexusOn(st, now); }
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
const FR = PHONE ? 256 : 512, FHZ = PHONE ? 30 : 60, FDECAY = PHONE ? 0.985 * 0.985 : 0.985, FSCALE = 5.12;
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
  const hits = ray.intersectObjects(stones.map((s) => s.mesh), false); if (!hits.length) return null;
  const st = stones.find((s) => s.mesh === hits[0].object); return { st, point: hits[0].point };
}
function onMove(e) {
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

// ---------------------------------------------------------------- frame
let frameNo = 0, lastNow = 0, booted = false;
function setRes(U) { if (U && U.uRes) U.uRes.value.set(W(), H()); if (U && U.uFrame) U.uFrame.value = frameNo % 64; }
function render(t) {
  const now = nowMs(), dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
  updateParallax(dt); pose(t);
  if (booted) { stepFrost(now, dt); updateLabels(now); placeLinks(); updatePlexus(now, t); }
  bgUniforms.uRes.value.set(W(), H()); bgUniforms.uTime.value = t; bgUniforms.uFrame.value = frameNo % 4096; bgLayout(t);
  for (const st of stones) setRes(st.mats.B && st.mats.B.userData.U);
  renderer.setClearColor(0x000000, 0);
  // the background the gems refract: no label plates in it
  const nLab = bgUniforms.uLabN.value; bgUniforms.uLabN.value = 0;
  bgUniforms.uPre.value = 0; for (const st of stones) st.group.visible = false; for (const P of plexi) P.obj.userData.v = P.obj.visible, P.obj.visible = false;
  renderer.setRenderTarget(rtBG); renderer.render(scene, camera);
  bgUniforms.uLabN.value = nLab;
  for (const st of stones) { st.group.visible = true; st.mats.B.userData.U.tBG.value = rtBG.texture; }
  for (const P of plexi) P.obj.visible = P.obj.userData.v;
  renderer.setRenderTarget(rtMain); renderer.render(scene, camera);
  runBloomAndComposite();
  frameNo++;
}

// ---------------------------------------------------------------- boot
const info = { look: LOOK, w: 0, h: 0, stones: [] };
(async () => {
  await Promise.all([document.fonts.load(`500 ${LAB_PX}px "IBM Plex Mono"`), document.fonts.load('500 13px "IBM Plex Mono"')]).catch(() => 0);
  const t0 = nowMs();
  await buildStones();
  info.buildMs = Math.round(nowMs() - t0);
  info.w = W(); info.h = H();
  info.stones = stones.map((s) => ({ shade: s.shade, tris: s.geo.attributes.position.count / 3, facets: s.geo.userData.facets }));
  makeTargets(); buildLabels(); buildLinks();
  for (const st of stones) { const U = st.mats.B.userData.U; U.uRest.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(st.rest)); U.uLatN.value = latticeScale(st); }
  pose(T_START); layoutTitles(); booted = true;
  // the titles arrive one by one, as the stones will in the scroll sequence
  const now = nowMs(); stones.forEach((st, j) => setOn(st.labs.title, true, now, 400 + j * 160));
  window.__renderAt = (t) => { render(t); return true; };
  window.__info = info; window.__stones = stones; window.__pool = pool; window.__setActive = setActive;
  render(T_START);
  window.__ready = true;
  if (!CAPTURE) { const s0 = nowMs(); const loop = () => { render(REDUCE ? T_START : T_START + (nowMs() - s0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
})().catch((e) => { window.__error = String(e && e.stack || e); console.error(e); });
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => location.reload(), 300); });
