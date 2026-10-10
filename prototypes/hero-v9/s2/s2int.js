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
