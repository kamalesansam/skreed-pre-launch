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
// the curve: (degrees round the logo, distance, height), level within a metre, over the ground's measured heights; the first
// point is the hero pose; past the pull-back only the logo is seen (the rest is wiped), so the camera can keep going
const CURVE_PTS = [[0, 24, -2.5], [-9, 26.5, -2.15], [5, 29, -1.95], [24, 32, -1.85], [35, 34, -1.8], [44, 38, -1.7], [40, 44, -1.5], [28, 50, -1.3], [15, 56, -1.1]];
let camCurveObj = null;
function camCurve(s, u2, outP, outT) {
  if (!camCurveObj) camCurveObj = new THREE.CatmullRomCurve3(CURVE_PTS.map(([th, R, y]) => new THREE.Vector3(R * Math.sin(th * Math.PI / 180), y, R * Math.cos(th * Math.PI / 180))), false, 'centripetal');
  camCurveObj.getPoint(Math.min(1, 0.5 * s + 0.5 * u2), outP); outT.copy(tgtFrom);
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
