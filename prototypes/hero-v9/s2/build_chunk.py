# Builds s2chunk.js (section 2 for the hero module) from the tested gem page (s2-gems.html), its tail (tail.js) and s2int.js.
import sys, re
SC = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad'
page = open(f'{SC}/show/s2gems/s2-gems.html').read().split('\n')
tail = open(f'{SC}/show/s2gems/tail.js').read()
s2int = open(f'{SC}/proto/s2/s2int.js').read()
L = lambda a, b: '\n'.join(page[a - 1:b])           # 1-based inclusive
def take(a, b, must_start):
    t = L(a, b); assert t.lstrip().startswith(must_start), (a, t[:80]); return t
parts = []
parts.append(take(54, 56, 'const FAM'))
parts.append(take(76, 81, 'function rng'))
parts.append(take(82, 176, '// ----'))                 # gem geometry (clipPolys .. gemGeometry)
parts.append(take(306, 315, '// ----'))                # equirect
parts.append(take(334, 352, 'function studioFn'))
parts.append(take(353, 372, '// ----'))                # GLSL_NOISE
parts.append(take(387, 485, '// ----'))                # background
tgt = take(486, 549, '// ----')
def sub(t, a, b, n=1):
    c = t.count(a); assert c == n, (a[:70], c); return t.replace(a, b)
tgt = sub(tgt, "let rtMain, rtA, rtBG, bloomRTs = [];", "let rtMain, rtBG, rtOut, bloomRTs = [];")
tgt = sub(tgt, """  const w = W(), h = H();
  rtMain = RT(w, h, { samples: 4 });
  rtA = RT(w, h, { minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true, samples: 0 });""",
"""  const w = W(), h = H();
  for (const t of [rtMain, rtBG, rtOut]) if (t) t.dispose(); for (const b of bloomRTs) { b.down.dispose(); b.up.dispose(); }
  rtMain = RT(w, h, { samples: 4 });
  rtOut = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false });     // sRGB-encoded colour, alpha = what the gems and flights cover""")
tgt = sub(tgt, "gl_FragColor = vec4(enc(c), 1.0); }` });", "gl_FragColor = vec4(enc(c), clamp(texture(tMain, uv).a, 0.0, 1.0)); }` });")
tgt = re.sub(r"  const DBG = Q\.get\('dbg'\);\n  composite\.uniforms\.tMain\.value = [^\n]*\n  composite\.uniforms\.uIntensity\.value = Q\.get\('dbg'\) \? 0 : BLOOM\.intensity;",
  "  composite.uniforms.tMain.value = rtMain.texture; composite.uniforms.uMask.value = 0; composite.uniforms.tBloom.value = small.texture; composite.uniforms.uTexel.value.set(1 / w, 1 / h);\n  composite.uniforms.uIntensity.value = BLOOM.intensity;", tgt)
assert "Q.get('dbg')" not in tgt
tgt = sub(tgt, "  renderer.setRenderTarget(null); renderer.render(S_comp, fsCam);", "  renderer.setRenderTarget(rtOut); renderer.render(S_comp, fsCam);")
parts.append(tgt)
scn = take(550, 572, '// ----')
scn = sub(scn, "const camera = new THREE.PerspectiveCamera(30, ASP, 0.1, 400);\ncamera.zoom = MODE === 'close' ? 1 : Math.min(1, 1.25 * ASP); camera.updateProjectionMatrix();\nconst fpx = (cssH / 2) / Math.tan(THREE.MathUtils.degToRad(15)) * camera.zoom;      // css px per unit at unit depth\n",
  "const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);\n")
parts.append(scn)
parts.append(take(585, 609, 'const pmrem'))
parts.append(take(698, 748, 'function matC'))
parts.append('const stones = [];')
parts.append(take(803, 806, 'const KW'))
i = tail.index('// ---------------------------------------------------------------- labels:'); j = tail.index('// ---------------------------------------------------------------- frame')
tl = tail[i:j]
tl = sub(tl, "const LAB_PX = PHONE ? 12 : 13;\n", "")
tl = sub(tl, "const labLayer = document.getElementById('labels'), svg = document.getElementById('leaders'), linkLayer = document.getElementById('links');",
  "const labLayer = document.getElementById('s2labels'), svg = document.getElementById('s2leaders'), linkLayer = document.getElementById('s2links');")
tl = sub(tl, "el.className = 'lab';", "el.className = 's2lab';")
tl = sub(tl, "PHONE ? 'TAP TO EXPLORE' : 'CLICK TO EXPLORE'", "TOUCH ? 'TAP TO EXPLORE' : 'CLICK TO EXPLORE'")
tl = sub(tl, "const FR = PHONE ? 256 : 512, FHZ = PHONE ? 30 : 60, FDECAY = PHONE ? 0.985 * 0.985 : 0.985, FSCALE = 5.12;", "const FR = TOUCH ? 256 : 512, FHZ = TOUCH ? 30 : 60, FDECAY = TOUCH ? 0.985 * 0.985 : 0.985, FSCALE = 5.12;")
# hover and picking only on landed gems while section 2 is live
tl = sub(tl, "  const hits = ray.intersectObjects(stones.map((s) => s.mesh), false); if (!hits.length) return null;",
  "  const hits = ray.intersectObjects(stones.filter((s) => s.L >= 1 && s.group.visible).map((s) => s.mesh), false); if (!hits.length) return null;")
tl = sub(tl, "function onMove(e) {\n  const now = nowMs(), touch = e.pointerType === 'touch';",
  "function onMove(e) {\n  if (!ready || !live || w2 > 0.3) { if (hoverSt) { hoverSt = null; if (activeBy === 'pointer') setActive(-1, ''); } return; }\n  const now = nowMs(), touch = e.pointerType === 'touch';")
tl = sub(tl, "  const now = nowMs(); downAt = [e.clientX, e.clientY];", "  if (!ready || !live) return;\n  const now = nowMs(); downAt = [e.clientX, e.clientY];")
tl = sub(tl, "if (touch && !e.buttons) return;", "if (touch && !e.buttons) return;")
tl = sub(tl, "L.el.classList.toggle('r', g.right);", "L.el.classList.toggle('r', g.right);")
head = """// =====================================================================
// Section 2: the ten gems (Gem C, Sam 2026-10-10), from the approved gem page (prototypes/section-2), in its own scope.
// Its own scene and camera render into its own targets; the hero's composite wipes to it and keeps the logo over it.
// =====================================================================
const S2 = (() => {
const LOOK = 'C', MODE = 'field', VCLOCK = false, REDUCE = reduce, TOUCH = matchMedia('(pointer: coarse)').matches;
const nowMs = () => performance.now();
let cssW = 1, cssH = 1, ASP = 1, PHONE = false, LAB_PX = 13, fpx = 1;
const W = () => renderer.domElement.width, H = () => renderer.domElement.height;
"""
out = head + '\n'.join(parts) + '\n' + tl + '\n' + s2int + '\n})();\n'
open(f'{SC}/proto/s2/s2chunk.js', 'w').write(out)
print('chunk', len(out))
