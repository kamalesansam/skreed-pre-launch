"""Patch light/t7_in.html -> light/t7_mid.html with the candidate lighting rig (scratch copy only)."""
import sys
src = open('light/t7_in.html').read()
n_rep = 0
def rep(old, new, count=1):
    global src, n_rep
    k = src.count(old)
    assert k == count, f'expected {count} match(es), found {k} for: {old[:70]!r}'
    src = src.replace(old, new); n_rep += 1

# 1. geometry: a per-vertex distance to the piece outline (world units) as attribute aEdge
rep("const P3 = [], ID = [], CEN = [], SIDE = [], HH = [];", "const P3 = [], ID = [], CEN = [], SIDE = [], HH = [], EDGE = [];")
rep("const push = (p, z, hh, side) => { P3.push(p.x, p.y, z); ID.push(id); CEN.push(cx, cy, 0); SIDE.push(side); HH.push(hh); };",
    "const segD = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1e-9; const u = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)); return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy); };\n"
    "    const ed = v.map((p, k) => { if (k < nb) return 0; let d = Infinity; for (let i = 0; i < nb; i++) d = Math.min(d, segD(p, v[i], v[(i + 1) % nb])); return d; });\n"
    "    const push = (p, z, hh, side, e = 0) => { P3.push(p.x, p.y, z); ID.push(id); CEN.push(cx, cy, 0); SIDE.push(side); HH.push(hh); EDGE.push(e); };")
rep("push(v[i0], DEPTH / 2, h[i0], 0); push(v[i1], DEPTH / 2, h[i1], 0); push(v[i2], DEPTH / 2, h[i2], 0);",
    "push(v[i0], DEPTH / 2, h[i0], 0, ed[i0]); push(v[i1], DEPTH / 2, h[i1], 0, ed[i1]); push(v[i2], DEPTH / 2, h[i2], 0, ed[i2]);")
rep("g.setAttribute('aH', new THREE.Float32BufferAttribute(HH, 1));",
    "g.setAttribute('aH', new THREE.Float32BufferAttribute(HH, 1));\n  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(EDGE, 1));")

# 2. tuning state: new params (URL-overridable)
rep("rimAz: 35, rimEl: 40 };",
    "rimAz: 35, rimEl: 40, bevel: 0.07, bevelAng: 50, alb: 0.02, wrap: 0.25, keyX: -6, keyY: 7, keyZ: 10, keyRad: 3.5, "
    "rimX: -5, rimY: 11, rimZ: -5, rimRad: 6, rim2: 0.0, rim2X: 9, rim2Y: 2, rim2Z: -4, rim2Rad: 4, floor: 0.18, hz: 0.06, sky: 0.008, ktemp: 1 };")
rep("  uRim: { get value() { return P.rim; } },",
    "  uBevelW: { get value() { return P.bevel; } }, uBevelAng: { get value() { return P.bevelAng * Math.PI / 180; } }, uAlb: { get value() { return P.alb; } }, uWrap: { get value() { return P.wrap; } },\n"
    "  uKeyPos: { get value() { return new THREE.Vector3(P.keyX, P.keyY, P.keyZ); } }, uKeyRad: { get value() { return P.keyRad; } },\n"
    "  uRimPos: { get value() { return new THREE.Vector3(P.rimX, P.rimY, P.rimZ); } }, uRimRad: { get value() { return P.rimRad; } },\n"
    "  uRim2: { get value() { return P.rim2; } }, uRim2Pos: { get value() { return new THREE.Vector3(P.rim2X, P.rim2Y, P.rim2Z); } }, uRim2Rad: { get value() { return P.rim2Rad; } },\n"
    "  uFloor: { get value() { return P.floor; } }, uHz: { get value() { return P.hz; } }, uSky: { get value() { return P.sky; } }, uKTemp: { get value() { return P.ktemp; } },\n"
    "  uRim: { get value() { return P.rim; } },")

# 3. vertex shader: carry aEdge
rep("attribute float aId; attribute vec3 aCentroid; attribute float aSide; attribute float aH;",
    "attribute float aId; attribute vec3 aCentroid; attribute float aSide; attribute float aH; attribute float aEdge;")
rep("varying vec3 vW; varying vec3 vRest; varying float vSide; varying float vDisp; varying float vId; varying vec2 vCen;\n    vec3 qrot",
    "varying vec3 vW; varying vec3 vRest; varying float vSide; varying float vDisp; varying float vId; varying vec2 vCen; varying float vEdge;\n    vec3 qrot")
rep("vW = wp.xyz; vRest = pos; vSide = aSide; vDisp = uD[i]; vId = aId; vCen = aCentroid.xy;",
    "vW = wp.xyz; vRest = pos; vSide = aSide; vDisp = uD[i]; vId = aId; vCen = aCentroid.xy; vEdge = aEdge;")

# 4. fragment shader: uniforms, helpers, the rig
rep("    uniform float uTime, uGlow, uRest, uTint, uGrad, uTex, uKey, uRim, uSpec, uRough, uBounce, uAmb; uniform vec3 uRimDir;\n"
    "    varying vec3 vW; varying vec3 vRest; varying float vSide; varying float vDisp; varying float vId; varying vec2 vCen;",
    "    uniform float uTime, uGlow, uRest, uTint, uGrad, uTex, uKey, uRim, uSpec, uRough, uBounce, uAmb; uniform vec3 uRimDir;\n"
    "    uniform float uBevelW, uBevelAng, uAlb, uWrap, uKeyRad, uRimRad, uRim2, uRim2Rad, uFloor, uHz, uSky, uKTemp; uniform vec3 uKeyPos, uRimPos, uRim2Pos;\n"
    "    varying vec3 vW; varying vec3 vRest; varying float vSide; varying float vDisp; varying float vId; varying vec2 vCen; varying float vEdge;")
HELPERS = r"""
    #define PI 3.14159265
    // GGX / Trowbridge-Reitz (Walter 2007), Schlick Fresnel (1994), Schlick-GGX Smith visibility (Karis 2013)
    float D_GGX(float NH, float a2){ float d = NH * NH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
    float G_Smith(float NV, float NL, float alpha){ float k = alpha * 0.5; return (NV / (NV * (1.0 - k) + k)) * (NL / (NL * (1.0 - k) + k)); }
    float F_Schlick(float VH, float F0){ return F0 + (1.0 - F0) * pow(1.0 - VH, 5.0); }
    // sphere area light (Karis 2013, representative point): the point on the sphere nearest the reflection ray stands in
    // for the whole source, and the lobe is widened by the source's angular size so a big soft source does not blow out.
    // Returns the specular term (already times NL); NLc is the plain cosine to the sphere's centre for the diffuse.
    float sphereSpec(vec3 Pl, float rad, vec3 Pw, vec3 N, vec3 V, float rough, float F0, out float NLc){
      vec3 Lc = Pl - Pw; float dist = length(Lc); NLc = dot(N, Lc / dist);
      vec3 R = reflect(-V, N); vec3 toRay = dot(Lc, R) * R - Lc;
      vec3 L = normalize(Lc + toRay * clamp(rad / max(length(toRay), 1e-4), 0.0, 1.0));
      float alpha = rough * rough, a2 = alpha * alpha;
      float alphaW = clamp(alpha + rad / (2.0 * dist), 0.0, 1.0); float norm = alpha / alphaW; norm *= norm;
      vec3 H = normalize(L + V);
      float NL = max(dot(N, L), 0.0), NV = max(dot(N, V), 1e-3), NH = max(dot(N, H), 0.0), VH = max(dot(V, H), 0.0);
      return D_GGX(NH, a2) * F_Schlick(VH, F0) * G_Smith(NV, NL, alpha) / max(4.0 * NV * NL, 1e-3) * NL * norm;
    }
"""
rep("      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }\n    void main(){\n      vec3 V = normalize(cameraPosition - vW);",
    "      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }\n" + HELPERS + "    void main(){\n      vec3 V = normalize(cameraPosition - vW);")

i0 = src.index("      // matte: Lambert with a soft wrap, no specular, no rim")
i1 = src.index("      // inner glow: the cut faces carry the shade")
RIG = r"""      // ---- material: matte black. Black paint sits at 2 to 5% diffuse albedo; a dielectric has F0 = 0.04, so on a black
      // surface the specular sheen carries more light than the diffuse: black is lit by what it reflects.
      float albedo = uAlb * mix(1.0, (0.8 + 0.4 * grain) * (0.85 + 0.3 * mottle), uTex);
      vec3 base = vSide > 0.5 ? mix(vec3(albedo), shade * albedo * 2.2, uTint * 6.0) : vec3(albedo);
      const float F0 = 0.04;
      // ---- bevel: within uBevelW of the block outline tilt the normal outward (normal-only round corner, as Arnold's
      // round_corners and Blender's Bevel node do), so the edge has a surface for the kicker and the floor to land on
      vec3 Nf = N;
      if (vSide < 0.5) {
        float fw = fwidth(vEdge) * 0.75;
        float t = 1.0 - smoothstep(uBevelW - fw, uBevelW + fw, vEdge);
        if (t > 0.0) {
          vec2 de = vec2(dFdx(vEdge), dFdy(vEdge));
          vec3 dWx = dFdx(vW), dWy = dFdy(vW);
          float a = dot(dWx, dWx), b = dot(dWx, dWy), c = dot(dWy, dWy); float det = max(a * c - b * b, 1e-14);
          vec3 inward = ((c * de.x - b * de.y) * dWx + (a * de.y - b * de.x) * dWy) / det;
          if (dot(inward, inward) < 1e-10) inward = vec3(vCen - vRest.xy, 0.0);     // a boundary-only triangle: fall back to the block centre
          float ang = t * uBevelAng;
          Nf = normalize(N * cos(ang) - normalize(inward) * sin(ang));
        }
      }
      float NV = max(dot(Nf, V), 1e-3);
      // ---- key: one big soft source, front upper left (the moon behind the camera, the same light that lights the snow).
      // Lambert with a soft wrap for the body, plus the broad GGX sheen: on matte black the sheen is the gradient you see.
      float NLk; float specK = sphereSpec(uKeyPos, uKeyRad, vW, Nf, V, uRough, F0, NLk);
      float dK = length(uKeyPos - vW); float keyI = uKey * 100.0 / (dK * dK);         // inverse square, 1.0 at 10 units
      float diffK = max((NLk + uWrap) / (1.0 + uWrap), 0.0);
      vec3 keyCol = mix(vec3(1.0), vec3(1.0, 0.96, 0.90), uKTemp);
      vec3 col = base * keyCol * keyI * diffK + uSpec * keyCol * keyI * specK;
      // ---- kicker: a cool strip source behind and above, on the side where the sky is blackest. It lands on the bevel
      // ring and the side faces only: that line is the silhouette.
      vec3 rimCol = vec3(0.80, 0.88, 1.0);
      float NLr; float specR = sphereSpec(uRimPos, uRimRad, vW, Nf, V, max(uRough * 0.8, 0.25), F0, NLr);
      float dR = length(uRimPos - vW); float rimI = uRim * 100.0 / (dR * dR);
      col += rimCol * rimI * (specR + base * max(NLr, 0.0) * 0.5);
      if (uRim2 > 0.0) {   // second, weaker strip on the other side (optional)
        float NLr2; float specR2 = sphereSpec(uRim2Pos, uRim2Rad, vW, Nf, V, max(uRough * 0.8, 0.25), F0, NLr2);
        float dR2 = length(uRim2Pos - vW); float rimI2 = uRim2 * 100.0 / (dR2 * dR2);
        col += rimCol * rimI2 * (specR2 + base * max(NLr2, 0.0) * 0.5);
      }
      // ---- environment: the snow floor below (bright, cool white), a fog band at the horizon, the near-black violet sky
      // above. Specular with roughness-aware Fresnel: the floor reflects in the under faces and the lower bevels at
      // grazing angles (that is the floor bounce you can actually see on a black object); diffuse hemisphere for the rest.
      vec3 R = reflect(-V, Nf);
      vec3 envFloor = vec3(0.86, 0.90, 1.0) * uFloor, envHz = vec3(0.92, 0.93, 1.0) * uHz, envSky = vec3(0.60, 0.45, 0.90) * uSky;
      vec3 env = mix(envFloor, envHz, smoothstep(-0.35, -0.02, R.y)); env = mix(env, envSky, smoothstep(0.0, 0.30, R.y));
      float Fr = F0 + (max(1.0 - uRough, F0) - F0) * pow(1.0 - NV, 5.0);
      col += uBounce * env * Fr;
      col += uAmb * base * mix(envFloor, envSky, 0.5 + 0.5 * Nf.y);
"""
src = src[:i0] + RIG + src[i1:]; n_rep += 1
open('light/t7_mid.html', 'w').write(src)
print('patched', n_rep, 'edits; size', len(src))
