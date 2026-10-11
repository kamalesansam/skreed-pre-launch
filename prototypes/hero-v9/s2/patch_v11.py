# template_v10.html -> template_v11.html: section 2 (the ten gems) wired into the hero
import sys
SC = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/proto'
s = open(f'{SC}/template_v10.html').read()
chunk = open(f'{SC}/s2/s2chunk.js').read()
def sub(a, b, n=1):
    global s; c = s.count(a); assert c == n, (a[:90], c); s = s.replace(a, b)
# page: a longer track (Sam: slower, a longer scene move, a long flight), igloo's label face, the section 2 layers
sub('.track{position:relative;height:460svh;pointer-events:none}',
    '.track{position:relative;height:1580svh;pointer-events:none}\n'
    '#s2labels{position:fixed;inset:0;pointer-events:none;z-index:3;visibility:hidden}#s2labels svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}\n'
    ".s2lab{position:absolute;left:0;top:0;font:500 13px/1.08 'IBM Plex Mono',ui-monospace,monospace;color:var(--pearl);white-space:pre;letter-spacing:0;text-transform:none;font-synthesis:none;will-change:transform}.s2lab.r{text-align:right}\n"
    '@media (max-aspect-ratio:9/10){.s2lab{font-size:12px}}\n'
    '#s2links{position:fixed;inset:0;pointer-events:none;z-index:3;visibility:hidden}.gem-link{position:absolute;left:0;top:0;display:block;-webkit-tap-highlight-color:transparent;outline:none}.gem-link:focus-visible{outline:2px solid var(--ember);outline-offset:4px}')
sub('family=Poppins:wght@700&family=Open+Sans:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400&display=swap',
    'family=Poppins:wght@700&family=Open+Sans:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400&family=IBM+Plex+Mono:wght@500&display=swap')
sub('<div class="track"></div>', '<div class="track"></div>\n<div id="s2labels" aria-hidden="true"><svg id="s2leaders"></svg></div><div id="s2links" role="navigation" aria-label="Colour families"></div>')
# logo: a mask mode (white where a block is) so the logo can stay over section 2 while the scene behind it is wiped away
sub("uPrint: { value: 1 }, uPrintCol: { value: new THREE.Color() }, tTri: { value: null },",
    "uPrint: { value: 1 }, uPrintCol: { value: new THREE.Color() }, tTri: { value: null }, uMask: { value: 0 },")
sub("uniform float uPrint; uniform vec3 uPrintCol; uniform sampler2D tTri;", "uniform float uPrint; uniform vec3 uPrintCol; uniform sampler2D tTri; uniform float uMask;")
sub("      gl_FragColor = vec4(col, am);\n", "      gl_FragColor = vec4(col, am);\n      if (uMask > 0.5) gl_FragColor = vec4(1.0);\n")
# the scene move: a level camera that backs away along a curve (Sam: no flying up), over a longer pull
sub("const tgtFrom = new THREE.Vector3(0, -0.9, 0), tgtTo = new THREE.Vector3(0, -2.6, -2);",
    "const tgtFrom = new THREE.Vector3(0, -0.9, 0), tgtTo = new THREE.Vector3(0, -2.6, -2);\nlet curveOn = false;   // the moon world's curved, level pull-back (Sam, 2026-10-10)")
sub("  const isMoon = name === 'spires';\n", "  const isMoon = name === 'spires'; curveOn = isMoon;\n")
# composite: a second pair (section 2 to the Wall), the kept logo, no slide of the hero layer in the first wipe
sub("uIntro: { value: 1 }, uFlat: { value: new THREE.Vector3(5 / 255, 5 / 255, 6 / 255) },   // the loader's night, in output sRGB",
    "uIntro: { value: 1 }, uFlat: { value: new THREE.Vector3(5 / 255, 5 / 255, 6 / 255) },   // the loader's night, in output sRGB\n"
    "  tH: { value: null }, tM: { value: null }, tS: { value: null }, uKeep: { value: 0 }, uParA: { value: 1 },   // section 2: the hero frame, the logo mask, section 2's cover")
sub("uniform sampler2D tA, tB, tScroll; uniform float uProgress, uAspect, uCalm, uIntro; uniform vec2 uNoiseOff; uniform vec3 uFlat;",
    "uniform sampler2D tA, tB, tScroll; uniform float uProgress, uAspect, uCalm, uIntro; uniform vec2 uNoiseOff; uniform vec3 uFlat;\n    uniform sampler2D tH, tM, tS; uniform float uKeep, uParA;")
sub("      if (cut < 1.0) s1 = ca(tA, vUv - vec2(0.0, parallaxY * cubicIn(uProgress) + disp * cutDisp), modulator, blurDiag * n.x);",
    "      if (cut < 1.0) s1 = ca(tA, vUv - vec2(0.0, (parallaxY * cubicIn(uProgress) + disp * cutDisp) * uParA), modulator, blurDiag * n.x);")
sub("    void main(){ gl_FragColor = vec4(mix(uFlat, wipe(), uIntro), 1.0); }`,",
    "    void main(){ vec3 col = wipe();\n"
    "      // section 2: the logo stays (never cut, never sliding), behind whatever section 2 draws in front of it\n"
    "      if (uKeep > 0.0) { float m = texture2D(tM, vUv).r * (1.0 - texture2D(tS, vUv).a) * uKeep; col = mix(col, texture2D(tH, vUv).rgb, m); }\n"
    "      gl_FragColor = vec4(mix(uFlat, col, uIntro), 1.0); }`,")
# the scroll map moves before section 2's module; section 2's timings
sub("// scroll map, in screens: 0 to 1.5 pull back, 1.5 to 2.5 the wipe (igloo's one-unit overlap), then the Wall\nconst PULL = 1.5, WIPE = 1.0;\n",
    "// scroll map, in screens: see S2T (declared with section 2)\n")
s2t = """
// scroll map, in screens (Sam, 2026-10-10: a longer scene move, then a long slow flight per block):
// 0 to PULL the camera backs away along a level curve; PULL to PULL + 1 the wipe into section 2 (the logo stays);
// from mid-wipe a block leaves every GAP screens and lands FLY screens later; a short rest; then the wipe to the Wall.
const PULL = 2.6, WIPE = 1.0;
const S2T = { CAS0: PULL + 0.5, GAP: 0.8, FLY: 1.8, W1END: PULL + WIPE };
S2T.LAND = S2T.CAS0 + 9 * S2T.GAP + S2T.FLY; S2T.W2 = S2T.LAND + 0.7;
// the path (Sam, 2026-10-11): straight back, weaving like a road: further left, the same distance right, then slowly back
// left; the camera keeps looking ahead (half-way to the logo), so it never circles the logo. v runs 0..1 over the pull-back
// and 1..2 after it, when only the logo is seen. Height: a 0.75 rise over the first third, then level (clears every dune).
const CAMX = [[0, 0], [0.25, -8], [0.6, 8], [1.0, -4], [1.5, -7], [2.0, -2]];
function camX(v) {
  for (let i = 1; i < CAMX.length; i++) if (v <= CAMX[i][0]) { const [v0, x0] = CAMX[i - 1], [v1, x1] = CAMX[i], t = (v - v0) / (v1 - v0);
    return x0 + (x1 - x0) * t * t * t * (t * (t * 6 - 15) + 10); }
  return CAMX[CAMX.length - 1][1];
}
function camCurve(s, u2, outP, outT) {
  const v = s + u2, x = camX(v), z = 24 + 20 * Math.min(v, 1) + 16 * Math.max(0, v - 1);
  const k = Math.min(1, v / 0.3), y = -2.5 + 0.75 * k * k * (3 - 2 * k);
  outP.set(x, y, z); outT.set(0.45 * x, tgtFrom.y, 0);
}
const rtMask = new THREE.WebGLRenderTarget(1, 1), _cc = new THREE.Color();
const blackT = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat); blackT.needsUpdate = true;
"""
sub("const screenScene = new THREE.Scene(); screenScene.add(composite);\n", "const screenScene = new THREE.Scene(); screenScene.add(composite);\n" + s2t + chunk)
# resize: section 2 and the mask follow the canvas
sub("  const p = asp < 0.9; if (p !== portrait || !wall.userData.done) { portrait = p; layoutWall(p); wall.userData.done = true; }\n}",
    "  const p = asp < 0.9; if (p !== portrait || !wall.userData.done) { portrait = p; layoutWall(p); wall.userData.done = true; }\n  rtMask.setSize(w * DPR, h * DPR); S2.resize(w, h);\n}")
# test hook: snap the scroll followers (frame tests)
sub("/*TEST*/window.__skreedSetT = (x) => { t = x; };/*TEST-END*/",
    "/*TEST*/window.__skreedSetT = (x) => { t = x; };/*TEST-END*/\n/*TEST*/window.__skreedSnap = (v) => { scroll.a = scroll.b = v; };/*TEST-END*/")
# step: build section 2 after the intro; hold the scroll at the wipe until it is ready
sub("  scroll.a = lerpFPS(scroll.a, pr, 0.075); scroll.b = lerpFPS(scroll.b, scroll.a, 0.15);   // igloo's two followers\n",
    "  scroll.a = lerpFPS(scroll.a, pr, 0.075); scroll.b = lerpFPS(scroll.b, scroll.a, 0.15);   // igloo's two followers\n"
    "  if (!S2.started && IN.phase === 'done') S2.build(yieldFrame);\n"
    "  if (!S2.ready && !S2.failed && scroll.b > PULL) scroll.b = PULL;   // section 2 is still being built: the wipe waits\n")
sub("  const tp = clamp01((scroll.b - PULL) / WIPE);\n", "  const tp = clamp01((scroll.b - PULL) / WIPE), tp2 = clamp01((scroll.b - S2T.W2) / WIPE);\n")
# a block that has left for section 2 is gone from the logo
sub("  logo.updateMatrixWorld();\n  updateLabels(dt,", "  for (let i = 0; i < blocks.length; i++) if (S2.hidden(i, scroll.b)) U.uOff.value[i].set(0, -500, 0);\n  logo.updateMatrixWorld();\n  updateLabels(dt,")
sub("  basePos.lerpVectors(camFrom, camTo, s); baseTgt.lerpVectors(tgtFrom, tgtTo, s);\n",
    "  if (curveOn && !reduce) camCurve(s, clamp01((scroll.b - PULL) / (S2T.LAND - PULL)), basePos, baseTgt);\n  else { basePos.lerpVectors(camFrom, camTo, s); baseTgt.lerpVectors(tgtFrom, tgtTo, s); }\n")
sub("  camA.lookAt(camA.position.clone().add(look));\n", "  camA.lookAt(camA.position.clone().add(look)); camA.updateMatrixWorld();\n  S2.update(scroll.b, tp, tp2, t, dt);\n")
sub("  camB.position.y = -(clamp01((scroll.b - PULL - WIPE) / 1.5)) * 0.8;", "  camB.position.y = -(clamp01((scroll.b - S2T.W2 - WIPE) / 1.5)) * 0.8;")
sub("""    if (tp < 1) A.c.render(dt);
    if (tp > 0) { renderer.toneMapping = THREE.NoToneMapping; B.c.render(dt); renderer.toneMapping = THREE.ACESFilmicToneMapping; }   // swatches stay true to the catalog
    C.tA.value = A.c.readBuffer.texture; C.tB.value = B.c.readBuffer.texture;
    C.uProgress.value = tp; C.uNoiseOff.value.set(Math.random(), Math.random());""",
"""    // hero, then section 2 (its own targets), then the Wall; the composite wipes hero to section 2, then section 2 to the Wall
    const s2on = S2.ready && tp > 0 && tp2 < 1, keep = s2on && tp2 <= 0 && S2.logoLeft(), wallOn = tp2 > 0 || (tp > 0 && !S2.ready);
    if (tp < 1 || keep) A.c.render(dt);
    if (s2on) S2.render();
    if (wallOn) { renderer.toneMapping = THREE.NoToneMapping; B.c.render(dt); renderer.toneMapping = THREE.ACESFilmicToneMapping; }   // swatches stay true to the catalog
    if (keep) { const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(); renderer.setClearColor(0x000000, 1); U.uMask.value = 1;
      renderer.setRenderTarget(rtMask); renderer.render(logo, camA); U.uMask.value = 0; renderer.setClearColor(pc, pa); }
    if (tp2 > 0) { C.tA.value = S2.out; C.tB.value = B.c.readBuffer.texture; C.uProgress.value = tp2; C.uParA.value = 1; }
    else { C.tA.value = A.c.readBuffer.texture; C.tB.value = s2on ? S2.out : B.c.readBuffer.texture; C.uProgress.value = tp; C.uParA.value = s2on ? 0 : 1; }
    C.tH.value = A.c.readBuffer.texture; C.tM.value = rtMask.texture; C.tS.value = s2on ? S2.out : blackT; C.uKeep.value = keep ? 1 : 0;
    C.uNoiseOff.value.set(Math.random(), Math.random());""")

sub("""  const pos = new Float32Array(nr * nc * 3), uv = new Float32Array(nr * nc * 2), idx = new Uint32Array((nr - 1) * (nc - 1) * 6);
  for (let r = 0; r < nr; r++) {
    const PY = -30 + 450 * Math.pow(1 - r / (nr - 1), 2.2), halfW = 34 + 1.25 * (PY + 30);
    for (let c = 0; c < nc; c++) {
      const k = r * nc + c;
      pos[k * 3] = (-1 + 2 * c / (nc - 1)) * halfW; pos[k * 3 + 1] = zmin + hq[k] / 65535 * (zmax - zmin); pos[k * 3 + 2] = -PY;
      uv[k * 2] = c / (nc - 1); uv[k * 2 + 1] = 1 - r / (nr - 1);
    }
  }
  let j = 0;
  for (let r = 0; r < nr - 1; r++) for (let c = 0; c < nc - 1; c++) {""",
"""  // the apron (2026-10-11): the bake stops 30 units in front of the logo; past it the near ground is mirrored about that edge,
  // so the level camera can back away without ever seeing the end of the world
  const NA = 100, DZ = 0.5, NT = nr + NA, Hq = (r, c) => zmin + hq[r * nc + c] / 65535 * (zmax - zmin);
  const pos = new Float32Array(NT * nc * 3), uv = new Float32Array(NT * nc * 2), idx = new Uint32Array((NT - 1) * (nc - 1) * 6);
  for (let r = 0; r < NT; r++) {
    if (r >= nr) {
      const z = 30 + (r - nr + 1) * DZ, PYm = z - 60, rr = (1 - Math.pow((PYm + 30) / 450, 1 / 2.2)) * (nr - 1), r0 = Math.min(nr - 2, Math.floor(rr)), fr = rr - r0, halfWm = 34 + 1.25 * (PYm + 30);
      for (let c = 0; c < nc; c++) {
        const k = r * nc + c, x = (-1 + 2 * c / (nc - 1)) * 34, cc = Math.min(nc - 1, Math.max(0, (x / halfWm + 1) / 2 * (nc - 1))), c0 = Math.min(nc - 2, Math.floor(cc)), fc = cc - c0;
        pos[k * 3] = x; pos[k * 3 + 1] = (Hq(r0, c0) * (1 - fc) + Hq(r0, c0 + 1) * fc) * (1 - fr) + (Hq(r0 + 1, c0) * (1 - fc) + Hq(r0 + 1, c0 + 1) * fc) * fr; pos[k * 3 + 2] = z;
        uv[k * 2] = cc / (nc - 1); uv[k * 2 + 1] = 1 - rr / (nr - 1);
      }
      continue;
    }
    const PY = -30 + 450 * Math.pow(1 - r / (nr - 1), 2.2), halfW = 34 + 1.25 * (PY + 30);
    for (let c = 0; c < nc; c++) {
      const k = r * nc + c;
      pos[k * 3] = (-1 + 2 * c / (nc - 1)) * halfW; pos[k * 3 + 1] = zmin + hq[k] / 65535 * (zmax - zmin); pos[k * 3 + 2] = -PY;
      uv[k * 2] = c / (nc - 1); uv[k * 2 + 1] = 1 - r / (nr - 1);
    }
  }
  let j = 0;
  for (let r = 0; r < NT - 1; r++) for (let c = 0; c < nc - 1; c++) {""")
sub("    const PY = Math.max(-30, -z), rr = (1 - Math.pow((PY + 30) / 450, 1 / 2.2)) * (nr - 1);",
    "    const PY = Math.max(-30, -(z > 30 ? 60 - z : z)), rr = (1 - Math.pow((PY + 30) / 450, 1 / 2.2)) * (nr - 1);   // the apron mirrors past z 30")
# 3) once the first wipe has covered the scene only the logo is seen: the ground and sky are skipped (no dune can cover the logo)
sub("    if (tp < 1 || keep) A.c.render(dt);", "    if (curveOn) moon.visible = tp < 1;\n    if (tp < 1 || keep) A.c.render(dt);")
# 4) the family pages: a gem's link opens its family's page over the scene; the Skreed mark there, or Back, returns
sub("<div id=\"s2labels\" aria-hidden=\"true\">", "<div id=\"famOverlay\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Shade family\" hidden></div>\n<div id=\"s2labels\" aria-hidden=\"true\">")
sub("#s2labels{position:fixed;inset:0;pointer-events:none;z-index:3;visibility:hidden}",
    "#famOverlay{position:fixed;inset:0;z-index:20;background:var(--pearl)}#famOverlay[hidden]{display:none}#famOverlay iframe{border:0;width:100%;height:100%;display:block}html.fam-open,html.fam-open body{overflow:hidden}\n#s2labels{position:fixed;inset:0;pointer-events:none;z-index:3;visibility:hidden}")
sub("function frame() { requestAnimationFrame(frame); /*TEST*/if (window.__skreedHold) return;/*TEST-END*/ step(); }",
    "function frame() { requestAnimationFrame(frame); /*TEST*/if (window.__skreedHold) return;/*TEST-END*/ if (HT.classList.contains('fam-open')) return; step(); }   // a family page over the scene: the scene rests")
fam = r"""
// =====================================================================
// The family pages (prototype, prototypes/family-pages): a gem's link (#/shades/<family>/) opens its family's page over the
// scene, in a frame of its own; the Skreed mark there (or Back) returns to the gems. The page arrives embedded (familyDoc).
// =====================================================================
const FAMILY = (() => {
  const box = document.getElementById('famOverlay'); let frm = null, back = null, html = null;
  const doc = () => { if (html) return html; const el = document.getElementById('familyDoc'); if (!el) return null;
    const bin = atob(el.textContent.trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return (html = new TextDecoder().decode(u)); };
  const parse = () => { const m = location.hash.match(/^#\/shades\/([a-z-]+)\/?/); return m ? m[1] : null; };
  function open(id) {
    const h = doc(); if (!h) return;
    back = document.activeElement;
    const boot = '<script>try{history.replaceState(null,"","#/shades/' + id + '/")}catch(e){location.hash="/shades/' + id + '/"}' +
      'addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a)return;var h=a.getAttribute("href")||"";' +
      'if(a.classList.contains("mark")||h.charAt(0)==="/"){e.preventDefault();e.stopPropagation();parent.postMessage({skreed:"close-family"},"*")}},true)<\/script>';
    if (frm) frm.remove();
    frm = document.createElement('iframe'); frm.title = 'Shade family';
    // a full document (the page is stored the way artifacts are, without a skeleton) whose links resolve inside the frame
    frm.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="about:srcdoc">' + boot + h;
    box.appendChild(frm); box.hidden = false; HT.classList.add('fam-open'); frm.focus();
  }
  function close() { if (!frm) return; frm.remove(); frm = null; box.hidden = true; HT.classList.remove('fam-open'); if (back && back.focus) back.focus({ preventScroll: true }); }
  const sync = () => { if (parse()) { if (!frm) open(parse()); } else close(); };
  addEventListener('hashchange', sync);
  addEventListener('message', (e) => { if (e.data && e.data.skreed === 'close-family') { if (parse()) history.back(); else close(); } });
  if (parse()) setTimeout(sync, 0);
  /*TEST*/window.__family = () => ({ open: !!frm, id: parse() });/*TEST-END*/
  return { open, close };
})();
"""
fam_js = fam
sub("const blackT = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat); blackT.needsUpdate = true;\n",
    "const blackT = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat); blackT.needsUpdate = true;\n" + fam_js)

# the DOM copy: the hero copy no longer slides up in the first wipe (the hero layer holds still, Sam: nothing flies up);
# the Wall's copy belongs to the second wipe now
sub("  heroCopy.style.transform = `translate3d(0,${(-0.4 * tp ** 3 * 100).toFixed(3)}vh,0)`;",
    "  heroCopy.style.transform = `translate3d(0,${(S2.ready ? 0 : -0.4 * tp ** 3 * 100).toFixed(3)}vh,0)`;")
sub("""  wallCopy.style.transform = `translate3d(0,${(0.4 * (1 - tp) ** 3 * 100).toFixed(3)}vh,0)`;
  wallCopy.style.clipPath = tp < 1 ? clipFor(tp, false) : 'none';
  wallCopy.style.visibility = tp <= 0 ? 'hidden' : 'visible';""",
"""  const wp = S2.ready || S2.started && !S2.failed ? tp2 : tp;
  wallCopy.style.transform = `translate3d(0,${(0.4 * (1 - wp) ** 3 * 100).toFixed(3)}vh,0)`;
  wallCopy.style.clipPath = wp < 1 ? clipFor(wp, false) : 'none';
  wallCopy.style.visibility = wp <= 0 ? 'hidden' : 'visible';""")
open(f'{SC}/template_v11.html', 'w').write(s)
print('ok', len(s))
