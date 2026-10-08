"""Patch light/t7_mid.html (Report 3's verified rig) -> light/t7_out.html: the synthesised rig.
Adds, on top of the measured sphere-light + bevel + environment base:
  1. grain-modulated roughness (the sheen breaks up like real matte paint)        [Report 1]
  2. edge wear on the bevel band: a handled edge is a touch glossier               [Reports 1, 3]
  3. occlusion on the cut faces inside the S (they see less of the rig)            [Report 1, uSpecOcc]
  4. a knee on the black material under the bloom threshold, glow added after it  [Report 2, uKnee]
  5. a cool/warm key colour (ktemp < 0 = moon-cool, > 0 = warm)                    [for the Night exterior preset]
"""
src = open('light/t7_mid.html').read()
n = 0
def rep(old, new, count=1):
    global src, n
    k = src.count(old)
    assert k == count, f'expected {count} match(es), found {k} for: {old[:70]!r}'
    src = src.replace(old, new); n += 1

# tuning state + uniform getters
rep("sky: 0.008, ktemp: 1 };", "sky: 0.008, ktemp: 1, wear: 0.0, occ: 0.35, knee: 0.55 };")
rep("uKTemp: { get value() { return P.ktemp; } },",
    "uKTemp: { get value() { return P.ktemp; } }, uWear: { get value() { return P.wear; } }, uOcc: { get value() { return P.occ; } }, uKnee: { get value() { return P.knee; } },")
rep("uniform float uBevelW, uBevelAng, uAlb, uWrap, uKeyRad, uRimRad, uRim2, uRim2Rad, uFloor, uHz, uSky, uKTemp;",
    "uniform float uBevelW, uBevelAng, uAlb, uWrap, uKeyRad, uRimRad, uRim2, uRim2Rad, uFloor, uHz, uSky, uKTemp, uWear, uOcc, uKnee;")
# bevel band amount kept for the wear term
rep("      vec3 Nf = N;\n", "      vec3 Nf = N; float bev = 0.0;\n")
rep("          float ang = t * uBevelAng;", "          bev = t; float ang = t * uBevelAng;")
# per-fragment roughness
rep("      float NV = max(dot(Nf, V), 1e-3);\n",
    "      float NV = max(dot(Nf, V), 1e-3);\n"
    "      // roughness: the grain breaks the sheen like real matte paint; a handled edge is a touch glossier (edge wear)\n"
    "      float rough = clamp(uRough * (0.9 + 0.2 * grain), 0.2, 1.0); rough = mix(rough, 0.35, uWear * bev * mottle);\n")
rep("sphereSpec(uKeyPos, uKeyRad, vW, Nf, V, uRough, F0, NLk)", "sphereSpec(uKeyPos, uKeyRad, vW, Nf, V, rough, F0, NLk)")
rep("max(uRough * 0.8, 0.25)", "max(rough * 0.8, 0.25)", 2)
rep("float Fr = F0 + (max(1.0 - uRough, F0) - F0)", "float Fr = F0 + (max(1.0 - rough, F0) - F0)")
# key colour: warm (ktemp > 0) or moon-cool (ktemp < 0)
rep("vec3 keyCol = mix(vec3(1.0), vec3(1.0, 0.96, 0.90), uKTemp);",
    "vec3 keyCol = uKTemp >= 0.0 ? mix(vec3(1.0), vec3(1.0, 0.96, 0.90), uKTemp) : mix(vec3(1.0), vec3(0.84, 0.90, 1.0), -uKTemp);")
# occlusion on the cut faces, knee under the bloom threshold (glow is added after, so it still blooms)
rep("      col += uAmb * base * mix(envFloor, envSky, 0.5 + 0.5 * Nf.y);\n",
    "      col += uAmb * base * mix(envFloor, envSky, 0.5 + 0.5 * Nf.y);\n"
    "      // the cut faces inside the S see less of the rig; a knee keeps the black material under the bloom threshold (0.62)\n"
    "      col *= 1.0 - uOcc * vSide * (0.4 + 0.6 * smoothstep(0.5, -0.5, vRest.z));\n"
    "      float hi = max(col.r, max(col.g, col.b)); if (hi > uKnee) col *= (uKnee + (hi - uKnee) * 0.3) / hi;\n")
open('light/t7_out.html', 'w').write(src)
print('patched', n, 'edits; size', len(src))
