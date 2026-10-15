import re, sys
D = sys.argv[1]
s = open(f'{D}/gemlooks/gem-looks.html').read()
tail = open(f'{D}/s2gems/tail.js').read()
def sub(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:70], c); s = s.replace(a, b)
# head: title, no Open Sans data font (labels use IBM Plex Mono from Google Fonts, as igloo's face), new CSS
sub('<title>Section 2 gem looks</title>', '<title>Section 2 gems</title>\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap">')
s, k = re.subn(r"\n  @font-face \{ font-family: 'Open Sans';[^\n]*", '', s); assert k == 1
sub("  .lab { position: absolute; left: 0; top: 0; font: 600 var(--label-px)/1 'Open Sans', sans-serif; color: var(--slate); white-space: nowrap; letter-spacing: 0; }\n",
    "  .lab { position: absolute; left: 0; top: 0; font: 500 var(--label-px)/1.08 'IBM Plex Mono', ui-monospace, monospace; color: var(--pearl); white-space: pre; letter-spacing: 0; font-synthesis: none; will-change: transform; }\n"
    "  .lab.r { text-align: right; }\n"
    "  #links { position: fixed; inset: 0; pointer-events: none; }\n"
    "  .gem-link { position: absolute; left: 0; top: 0; display: block; pointer-events: auto; -webkit-tap-highlight-color: transparent; outline: none; }\n"
    "  .gem-link:focus-visible { outline: 2px solid var(--ember); outline-offset: 4px; }\n"
    "  html, body { touch-action: none; }\n")
s, k = re.subn(r"  nav \{[^\n]*\n  nav button \{[^\n]*\n[^\n]*\n  nav button:hover[^\n]*\n  nav button\[aria-pressed[^\n]*\n  nav button:focus-visible[^\n]*\n  body.capture nav \{ display: none; \}\n", '', s); assert k == 1, 'nav css'
s, k = re.subn(r'<nav aria-label="Stone look">\n.*?\n</nav>', '<div id="links" role="navigation" aria-label="Colour families"></div>', s, flags=re.S); assert k == 1
# Gem C only
sub("let LOOK = (Q.get('look') || HQ.get('look') || 'C').toUpperCase(); if (!LOOKS.includes(LOOK)) LOOK = 'C';", "const LOOK = 'C';      // Sam, 2026-10-10")
s, k = re.subn(r"document\.querySelectorAll\('nav button'\)\.forEach\(\(b\) => \{\n.*?\n\}\);\n", '', s, flags=re.S); assert k == 1, 'nav js'
# background: up to 30 label plates, each with its own strength; Pearl Whisper text needs the fog darkened under it (luma 113 or less, 4.5:1)
sub("uLab: { value: new Float32Array(40) }, uLabN: { value: 0 }, uLabFeather: { value: 10 },", "uLab: { value: new Float32Array(120) }, uLabA: { value: new Float32Array(30) }, uLabN: { value: 0 }, uLabFeather: { value: 10 },")
sub("uniform vec4 uS[6]; uniform vec4 uSB[6]; uniform vec4 uLab[10];", "uniform vec4 uS[6]; uniform vec4 uSB[6]; uniform vec4 uLab[30]; uniform float uLabA[30];")
sub("""    // label plates: the fog under each label lifted to at least Y 168 (Urban Slate text then holds 4.5:1)
    if (uPre < 0.5) { float m = 0.0;
      for (int i = 0; i < 10; i++) { if (float(i) >= uLabN) break; vec4 r = uLab[i];
        vec2 dd = max(r.xy - px, px - r.zw); float e = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0); m = max(m, 1.0 - smoothstep(0.0, uLabFeather, e)); }
      float Y = dot(srgb, vec3(0.2126, 0.7152, 0.0722)); srgb += m * max(0.0, 168.0 / 255.0 - Y); }""",
"""    // label plates: the fog under each label darkened to luma 113 or less (Pearl Whisper text then holds 4.5:1), feathered
    if (uPre < 0.5) { float m = 0.0;
      for (int i = 0; i < 30; i++) { if (float(i) >= uLabN) break; vec4 r = uLab[i];
        vec2 dd = max(r.xy - px, px - r.zw); float e = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0); m = max(m, uLabA[i] * (1.0 - smoothstep(0.0, uLabFeather, e))); }
      float Y = dot(srgb, vec3(0.2126, 0.7152, 0.0722)), T = 113.0 / 255.0; if (Y > T) srgb *= mix(1.0, T / Y, m); }""")
# Gem C material: the hover frost drawn on the gem (rest look unchanged while the buffer is empty)
sub("    uAbsorb: { value: ab }, uAbsorbK: { value: 0.45 }, uGlow: { value: glow }, uCore: { value: 1.5 }, uCoreR: { value: 0.32 } };",
    "    uAbsorb: { value: ab }, uAbsorbK: { value: 0.45 }, uGlow: { value: glow }, uCore: { value: 1.5 }, uCoreR: { value: 0.32 },\n"
    "    tFrost: { value: blackTex }, uFrostOn: { value: 0 }, uFrostGain: { value: 2.5 }, tLat: { value: latTex }, uLatN: { value: 6 }, uRest: { value: new THREE.Matrix3() },\n"
    "    uRim: { value: new THREE.Vector3(...linArr('#83a1c5')) }, uFrostScale: { value: FSCALE } };")
sub("    totalDiffuse = (1.0 - Fr) * col;\n  `;",
    "    totalDiffuse = (1.0 - Fr) * col;\n"
    "    // hover: igloo's frost, emissive = rim x rim colour + lattice x rim x 10 + lattice x frost^2; x2.5 because igloo blooms\n    // its whole scene from a 0.2 threshold and Gem C blooms from 0.75, so the crackle reads as bright as igloo's\n"
    "    if (uFrostOn > 0.5) { vec2 fuv = (uRest * vObj).xy / uFrostScale + 0.5; vec2 fg = texture(tFrost, fuv).rg; float lat = texture(tLat, fuv * uLatN).r;\n"
    "      totalEmissiveRadiance += uFrostGain * (fg.y * uRim + lat * fg.y * 10.0 + lat * fg.x * fg.x); }\n  `;")
sub("    pars: 'uniform sampler2D tBG; uniform vec2 uRes; uniform float uIor, uNP, uAbsorbK, uCore, uCoreR; uniform vec4 uPlanes[32]; uniform vec3 uAbsorb, uGlow;\\n' +",
    "    pars: 'uniform sampler2D tBG; uniform vec2 uRes; uniform float uIor, uNP, uAbsorbK, uCore, uCoreR; uniform vec4 uPlanes[32]; uniform vec3 uAbsorb, uGlow;\\n' +\n"
    "      'uniform sampler2D tFrost, tLat; uniform float uFrostOn, uFrostGain, uLatN, uFrostScale; uniform mat3 uRest; uniform vec3 uRim;\\n' +")
# parallax: igloo's camera orbit as a turn of each stone in place
sub("    st.group.quaternion.copy(new THREE.Quaternion().setFromEuler(e).multiply(st.rest));",
    "    st.group.quaternion.copy(qPar).multiply(new THREE.Quaternion().setFromEuler(e)).multiply(st.rest);")
# replace the old labels, frame and boot with the new ones
i = s.index('// ---------------------------------------------------------------- labels (DOM'); j = s.index('</script>\n</body>')
s = s[:i] + tail + s[j:]
open(f'{D}/s2gems/s2-gems.html', 'w').write(s)
print('ok', len(s))
