// The GLSL the v10 intro and the v11 section 2 add to the v9.10 shaders (tests/fixtures/hero-v11.4/template.html), as
// slot strings and the materials the intro builds. Every string is copied from the prototype; tests/unit/glsl-v11.test.ts
// checks the ones that are whole literals there (the composite, the cage, the outline, the numbers, the tiling) against
// the fixture, and that the slot strings carry the prototype's print, sky and floor code verbatim.
// The logo and sky slots recompute the v9.10 output expression instead of reading gl_FragColor back, which gives the
// same floats (the same operations, in the same order) without reading a fragment output.

/** igloo's reveal helper, re-expressed in GLSL: a front that sweeps from s to e with a soft margin m, at progress p (iFallS: smooth) */
export const IGL = `float iLin(float a, float b, float x){ return clamp((x - a) / (b - a), 0.0, 1.0); }
float iFall(float x, float s, float e, float m, float p){ float M = m * sign(e - s), f = mix(s - M, e, p); return iLin(f + M, f, x); }
float iFallS(float x, float s, float e, float m, float p){ float M = m * sign(e - s), f = mix(s - M, e, p), k = iLin(f + M, f, x); return k * k * (3.0 - 2.0 * k); }
`;

// ---- the logo: the intro print (igloo's materialise) and the mask the section 2 hand-over draws the logo through
export const LOGO_FRAG_PARS = `
    uniform float uPrint; uniform vec3 uPrintCol; uniform sampler2D tTri; uniform float uMask;
    ${IGL}`;
/** The prototype's print block, verbatim, then its mask line; am is v9.10's alpha expression. */
export const LOGO_PRINT = `      if (uPrint < 1.0) {
        float e = 1.0 - iFallS(vRest.y, 3.38, -2.905, 2.17, uPrint);
        if (e > 0.9999) discard;
        vec3 an = abs(N); vec2 tq = an.y > 0.5 ? vRest.xz : (an.x > 0.5 ? vRest.zy : vRest.xy);
        e += clamp(e * texture2D(tTri, tq * 0.6).r * 13.0, 0.0, 1.0);
        col = min(col + e * uPrintCol, vec3(2.0)); am = max(am, step(0.001, e));
      }
      gl_FragColor = vec4(col, am);
      if (uMask > 0.5) gl_FragColor = vec4(1.0);`;
export const LOGO_FRAG_OUT = `
      float am = vSide > 0.5 ? 1.0 : 0.0;
${LOGO_PRINT}`;

// ---- the sky: the flat night field at the start, then the sky (below the horizon with the snow)
export const SKY_FRAG_PARS = ` uniform vec3 uFlat; uniform float uSkyP, uSkyB;`;
export const SKY_MIX = `if (uSkyP < 1.0 || uSkyB < 1.0) col = mix(uFlat, col, vDir.y < 0.0 ? uSkyB : uSkyP);   // intro: the night field, then the sky (below the horizon with the snow)`;
export const SKY_FRAG_OUT = `
        { vec3 col = sky + wash * uHue * dark;
        ${SKY_MIX}
        gl_FragColor = vec4(col, 1.0); }`;

// ---- the floor (igloo's terrain reveal): the snow disc, its bright rim and the triangle ring, on the ground and the stones.
// One chunk, skipped at rest (uU2 = 1), so the hero's floor is untouched once the intro is over.
export const FLOOR_INTRO_COLOR = `#include <color_fragment>
    if (uU2 < 1.0) {
      // distance from the mark's footprint (a box), pushed out by up to 3.5 units of smooth mosaic noise: a jagged, stair-stepped edge.
      // The disc runs 1.8 units from the box, so the first snow touches the mark's front base at 2.45 s and wraps it by 2.6 s;
      // the unlit floor and the far field keep the 3.43 offset they were timed on (gf)
      vec2 dq = abs(vWPos.xz - uO.xz) - vec2(2.8, 0.475);
      float gd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0), gs = 1.8 + gd, g = gs + texture2D(tMosaic, vWPos.xz * 0.07).r * 3.5, gf = gd + 3.43;
      float tri = texture2D(tTri, vWPos.xz * 0.5).r;   // half-unit triangles: a fine frost speckle, not a wireframe
      vec3 base = diffuseColor.rgb;
      float tA = iFall(g, -0.1, 31.9, 0.1, uU2);                                            // the disc, hard edged
      float trA = uRing * iFall(g, 1.0, 33.0, 0.1, uU) * (1.0 - iFallS(g, 0.0, 32.0, 6.0, uU)) * tri;   // the triangle ring just ahead of it
      // the white-hot rim: both bands on the same noisy distance as the disc edge, so the glow hugs the jagged front. Inside it the
      // pool is revealed terrain: the wide band carries only the triangle speckle, the narrow flat band widens with distance so the
      // front stays a frosty band at grazing angles, and the whole glow fades out as the front leaves the frame (3.5 to 4 s)
      vec3 c = base + ((1.0 - iFallS(g, 0.0, 32.0, 8.0, uU2)) * 4.0 * tri + 1.0 - iFallS(g, 0.0, 32.0, 3.0 + 0.2 * max(gs - 8.0, 0.0), uU2) + 1.0 - tA)
        * uGlowCol * (1.0 - smoothstep(0.6, 0.75, uU2));
      // the not-yet-lit floor: night near the mark while the camera is high, then the whole floor opaque as the crane descends
      // (igloo's unrevealed ground is its grey field; ours would read as a black hole or as see-through ridges)
      float a = tA + trA * (1.0 - tA), dim = mix(smoothstep(12.0, 24.0, gf), 1.0, uDimN) * uDim, ao = a + dim * (1.0 - a);
      c = (c * a + base * dim * (1.0 - a)) / max(ao, 1e-4);
      float far = smoothstep(32.0, 36.0, gf) * uFarA;
      diffuseColor = vec4(min(mix(c, base, far), vec3(4.0)), max(ao, far) * uFloorA);
    }`;
export const floorIntroCommon = (stones: boolean): string => `#include <common>
    ${stones ? 'varying vec3 vWPos;' : ''} uniform float uU, uU2, uFloorA, uFarA, uDim, uDimN, uRing; uniform vec3 uO, uGlowCol; uniform sampler2D tTri, tMosaic;
    ${IGL}`;

// ---- the composite (v11): the wipe as a function, the kept logo over section 2, the intro's flat night (one literal in the prototype)
export const COMPOSITE_FRAG_V11 = `
    uniform sampler2D tA, tB, tScroll; uniform float uProgress, uAspect, uCalm, uIntro; uniform vec2 uNoiseOff; uniform vec3 uFlat;
    uniform sampler2D tH, tM, tS; uniform float uKeep, uParA;
    varying vec2 vUv;
    float linstep(float a, float b, float t){ return clamp((t - a) / (b - a), 0.0, 1.0); }
    // a sweep from start to end with a soft margin; progress 0..1 moves it across
    float falloff(float x, float start, float end, float margin, float progress){
      float m = margin * sign(end - start); float p = mix(start - m, end, progress); return linstep(p + m, p, x); }
    float cubicIn(float t){ return t * t * t; }
    // dither: interleaved gradient noise, re-offset every frame (igloo uses a blue-noise texture)
    float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
    // 5-tap spectral chromatic aberration with a barrel bend
    vec4 spectrum(float t){ float lo = step(t, 0.5); float hi = 1.0 - lo; float w = clamp(1.0 - abs(2.0 * clamp((t - 1.0/6.0) / (4.0/6.0), 0.0, 1.0) - 1.0), 0.0, 1.0);
      return pow(vec4(lo, 1.0, hi, 1.0) * vec4(1.0 - w, w, 1.0 - w, 1.0), vec4(1.0 / 2.2)); }
    vec2 barrel(vec2 uv, float amt){ vec2 cc = uv - 0.5; return uv + cc * dot(cc, cc) * amt; }
    vec3 ca(sampler2D t, vec2 uv, float maxd, float bend){
      vec4 sum = vec4(0.0), sw = vec4(0.0);
      for (int i = 0; i < 5; i++) { float k = float(i) / 5.0; vec4 w = spectrum(k); sw += w; sum += w * texture2D(t, barrel(uv, bend * maxd * k)); }
      return (sum / sw).rgb; }
    vec3 wipe(){
      if (uProgress <= 0.0) return texture2D(tA, vUv).rgb;
      if (uProgress >= 1.0) return texture2D(tB, vUv).rgb;
      vec2 uvTex = vUv - 0.5; uvTex.x *= uAspect; uvTex += 0.5;
      vec3 st = texture2D(tScroll, uvTex).rgb;
      float slopeDisp = (st.b * 2.0 - 1.0) * 0.4;
      float slope = -0.2 * uAspect;
      float incl = vUv.x + slopeDisp;
      float incP = uProgress * (1.0 + abs(slope));
      float sweep = vUv.y + incl * abs(slope);
      float blurDiag = falloff(sweep, 0.0, 1.0, 2.0, incP);
      float dispDiag = falloff(sweep, 0.0, 1.0, 0.9, incP);
      float cutDisp = falloff(st.g, 0.0, 1.0, 1.0, dispDiag);
      float cutDiag = falloff(sweep, 0.0, 1.0, 0.2, incP);
      float cut = falloff(st.r, 0.0, 1.0, 2.0, cutDiag);
      float parallaxY = 0.4 * (1.0 - uCalm); float disp = 0.025 * (1.0 - uCalm);
      vec2 n = vec2(ign(gl_FragCoord.xy + uNoiseOff * 97.0), ign(gl_FragCoord.xy + uNoiseOff.yx * 131.0 + 17.0));
      float modulator = 12.0 * (1.0 - uCalm) * smoothstep(1.0, 0.7, abs(vUv.x * 2.0 - 1.0)) * smoothstep(1.0, 0.7, abs(vUv.y * 2.0 - 1.0));
      vec3 s1 = vec3(0.0), s2 = vec3(0.0);
      if (cut < 1.0) s1 = ca(tA, vUv - vec2(0.0, (parallaxY * cubicIn(uProgress) + disp * cutDisp) * uParA), modulator, blurDiag * n.x);
      if (cut > 0.0) s2 = ca(tB, vUv + vec2(0.0, parallaxY * cubicIn(1.0 - uProgress) + disp * (1.0 - cutDisp)), modulator, (1.0 - blurDiag) * n.y);
      return clamp(mix(s1, s2, cut), 0.0, 1.0);
    }
    void main(){ vec3 col = wipe();
      // section 2: the logo stays (never cut, never sliding), behind whatever section 2 draws in front of it
      if (uKeep > 0.0) { float m = texture2D(tM, vUv).r * (1.0 - texture2D(tS, vUv).a) * uKeep; col = mix(col, texture2D(tH, vUv).rgb, m); }
      gl_FragColor = vec4(mix(uFlat, col, uIntro), 1.0); }`;

// ---- the intro's wire layers: the cage (the shockwave), the outline (the brick-edge wire) and the counting sprites
export const CAGE_VERT = 'attribute vec3 aC; attribute float aPh; varying vec3 vC; varying float vPh; void main(){ vC = (modelMatrix * vec4(aC, 1.0)).xyz; vPh = aPh; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }';
export const CAGE_FRAG = `uniform vec3 uCol, uO; uniform float uA, uP, uTime; varying vec3 vC; varying float vPh;
  void main(){ float a = uA * iFall(length(vC - uO), 0.0, 20.0, 5.0, uP) * (sin(vPh * 13.0 + uTime * 6.0) * 0.5 + 0.5); gl_FragColor = vec4(uCol * a, step(0.004, a)); }`;
export const OUTLINE_VERT = 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }';
export const OUTLINE_FRAG = `uniform vec3 uCol; uniform float uA, uP, uK, uTime; varying vec3 vW;
  void main(){ vec3 w = vW * 6.0; float T = uTime * 5.0;
    float idle = (sin(w.y + T) * 0.5 + 0.5) * (cos(w.z + T) * 0.5 + 0.5) * (sin(w.x + T) * 0.5 + 0.5) * 0.8 + 0.2;
    float a = uK * uA * idle * iFallS(vW.y, 2.73, -2.18, 2.89, uP); gl_FragColor = vec4(uCol * a, step(0.004, a)); }`;
export const NUMS_VERT = 'attribute float aD; uniform float uSize; varying float vD; void main(){ vD = aD; gl_PointSize = uSize; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }';
export const NUMS_FRAG = `uniform vec3 uCol; uniform float uP; uniform sampler2D tNum; varying float vD;
  void main(){ float n = floor(uP * 48.0 - vD), cell = n >= 0.0 && n <= 30.0 ? n + 1.0 : 1.0;
    float g = texture2D(tNum, vec2(gl_PointCoord.x, 1.0 - (cell + gl_PointCoord.y) / 32.0)).r;
    float a = 0.5 * iFall(vD, 0.0, 20.0, 5.0, uP); gl_FragColor = vec4(min(uCol * g, vec3(1.0)) * a, step(0.004, a * g)); }`;

// ---- the periodic jittered triangle tiling, baked once on the GPU (tTri)
export const TRI_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
export const TRI_FRAG = `varying vec2 vUv;
      float h(vec2 c, float s){ return fract(sin(dot(mod(c, 14.0), vec2(127.1, 311.7)) + s) * 43758.5453); }
      vec2 V(vec2 c){ return c + 0.35 * (vec2(h(c, 1.0), h(c, 2.0)) * 2.0 - 1.0); }
      float sg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
      void main(){
        vec2 p = vUv * 14.0, c0 = floor(p); float d = 9.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 c = c0 + vec2(i, j), a = V(c), b = V(c + vec2(1.0, 0.0)), e = V(c + vec2(0.0, 1.0)), f = V(c + vec2(1.0));
          d = min(d, min(sg(p, a, b), sg(p, a, e))); d = min(d, h(c, 3.0) < 0.5 ? sg(p, a, f) : sg(p, b, e));
        }
        gl_FragColor = vec4(vec3(1.0 - smoothstep(0.2, 1.0, d * 512.0 / 14.0)), 1.0);
      }`;
