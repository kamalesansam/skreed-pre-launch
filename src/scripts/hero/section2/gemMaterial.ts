// Gem C's material (prototype v11.4 template.html, section 2 "patch helper", REFRACT_PARS, matC; section-2.md 4): one
// pass on a MeshPhysicalMaterial: screen-space refraction of the background (IOR 1.70, per-channel split R x0.985,
// B x1.03), two inner bounces traced against the gem's own facet planes (up to 32), shade absorption, a luminous core of
// radius 0.32 at the centre, the Khronos Neutral tone curve. The hover frost (section2/frost.ts) adds its emission here.
import { BackSide, Color, FrontSide, Matrix3, MeshPhysicalMaterial, Vector2, Vector3, type Texture } from 'three';

export const GLSL_NOISE = /* glsl */`
  vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn3(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
  vec4 cell3(vec3 p) { vec3 i = floor(p), f = fract(p); float d1 = 9.0; vec3 id = i;
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 g = vec3(x, y, z); vec3 r = g + h33(i + g) - f; float d = dot(r, r); if (d < d1) { d1 = d; id = i + g; } }
    return vec4(h33(id + 3.7), sqrt(d1)); }
  vec3 encSRGB(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }
  vec3 decSRGB(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  // Khronos PBR Neutral tone curve (published formula), written out
  vec3 neutralTone(vec3 c) { float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
    float pk = max(c.r, max(c.g, c.b)); if (pk < 0.76) return c; float d = 0.24; float np = 1.0 - d * d / (pk + d - 0.76);
    c *= np / pk; float g = 1.0 - 1.0 / (0.15 * (pk - np) + 1.0); return mix(c, vec3(np), g); }
`;

export interface GemUniforms {
  tBG: { value: Texture | null }; uRes: { value: Vector2 }; uIor: { value: number }; uPlanes: { value: Float32Array }; uNP: { value: number };
  uAbsorb: { value: Vector3 }; uAbsorbK: { value: number }; uGlow: { value: Vector3 }; uCore: { value: number }; uCoreR: { value: number };
  tFrost: { value: Texture }; uFrostOn: { value: number }; uFrostGain: { value: number }; tLat: { value: Texture }; uLatN: { value: number }; uRest: { value: Matrix3 };
  uRim: { value: Vector3 }; uFrostScale: { value: number };
}
export type GemMaterial = MeshPhysicalMaterial & { userData: { U: GemUniforms; kind: string } };

const linArr = (h: string) => { const c = new Color(h); return [c.r, c.g, c.b]; };

/** add our uniforms and code to a MeshPhysicalMaterial */
function patch(mat: MeshPhysicalMaterial, U: GemUniforms, { vert = '', vmain = '', pars = '', replace = {} as Record<string, string> } = {}): GemMaterial {
  mat.userData.U = U;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec3 vObj; varying vec3 vWPos;\n' + vert)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vObj = position; vWPos = (modelMatrix * vec4(position, 1.0)).xyz;\n' + vmain);
    let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\n varying vec3 vObj; varying vec3 vWPos;\n uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat3 normalMatrix;\n' + GLSL_NOISE + pars);
    for (const [k, v] of Object.entries(replace)) fs = fs.replace(k, v);
    sh.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => 'C' + (mat.side === BackSide ? 'b' : 'f') + (mat.userData.kind || '');
  return mat as GemMaterial;
}

export interface FrostRefs { blackTex: Texture; latTex: Texture; FSCALE: number }

export function matC(shadeHex: string, planes: number[][], envTex: Texture, frost: FrostRefs): GemMaterial {
  const sh = new Color(shadeHex);
  const ab = new Vector3(-Math.log(Math.max(sh.r, 0.03)), -Math.log(Math.max(sh.g, 0.03)), -Math.log(Math.max(sh.b, 0.03)));
  const P = new Float32Array(32 * 4); planes.slice(0, 32).forEach((p, i) => P.set(p, i * 4));
  const glow = new Vector3(sh.r, sh.g, sh.b).multiplyScalar(1.0 / Math.max(0.35, Math.pow(Math.max(sh.r, sh.g, sh.b), 0.5)));
  const rim = linArr('#83a1c5');   // igloo's frost rim colour, a render light (E-A2b)
  const U: GemUniforms = { tBG: { value: null }, uRes: { value: new Vector2() }, uIor: { value: 1.70 }, uPlanes: { value: P }, uNP: { value: Math.min(32, planes.length) },
    uAbsorb: { value: ab }, uAbsorbK: { value: 0.45 }, uGlow: { value: glow }, uCore: { value: 1.5 }, uCoreR: { value: 0.32 },
    tFrost: { value: frost.blackTex }, uFrostOn: { value: 0 }, uFrostGain: { value: 2.5 }, tLat: { value: frost.latTex }, uLatN: { value: 6 }, uRest: { value: new Matrix3() },
    uRim: { value: new Vector3(rim[0], rim[1], rim[2]) }, uFrostScale: { value: frost.FSCALE } };
  const m = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, ior: 1.70, specularIntensity: 1, transmission: 0,
    clearcoat: 0.0, envMap: envTex, envMapIntensity: 1.0, side: FrontSide, flatShading: true });
  m.userData.kind = 'C';
  const MAIN = /* glsl */`
    vec3 nW = inverseTransformDirection(normal, viewMatrix); vec3 vW = normalize(cameraPosition - vWPos);
    mat3 Rm = mat3(normalize(modelMatrix[0].xyz), normalize(modelMatrix[1].xyz), normalize(modelMatrix[2].xyz)); float sc = length(modelMatrix[0].xyz);
    vec3 rW = refract(-vW, nW, 1.0 / uIor); vec3 r = transpose(Rm) * rW; vec3 o = vObj;
    // bounce 1: where the ray leaves the convex stone (nearest plane ahead)
    float t1 = 1e3; vec3 n1 = vec3(0, 1, 0);
    for (int i = 0; i < 32; i++) { if (float(i) >= uNP) break; vec4 p = uPlanes[i]; float dn = dot(r, p.xyz); if (dn <= 1e-4) continue;
      float t = (p.w - dot(o, p.xyz)) / dn; if (t > 1e-4 && t < t1) { t1 = t; n1 = p.xyz; } }
    vec3 p1 = o + r * t1; vec3 col = vec3(0.0);
    vec3 outR = refract(r, -n1, uIor * 0.985), outG = refract(r, -n1, uIor), outB = refract(r, -n1, uIor * 1.03);
    vec3 r2 = reflect(r, -n1);
    float t2 = 1e3; vec3 n2 = vec3(0, 1, 0);
    for (int i = 0; i < 32; i++) { if (float(i) >= uNP) break; vec4 p = uPlanes[i]; float dn = dot(r2, p.xyz); if (dn <= 1e-4) continue;
      float t = (p.w - dot(p1, p.xyz)) / dn; if (t > 1e-4 && t < t2) { t2 = t; n2 = p.xyz; } }
    vec3 out2 = refract(r2, -n2, uIor); if (dot(out2, out2) < 1e-5) out2 = reflect(r2, -n2);
    vec3 bounce2 = textureCubeUV(envMap, envMapRotation * (Rm * normalize(out2)), 0.03).rgb * envMapIntensity * exp(-uAbsorb * uAbsorbK * (t1 + t2) * sc);
    if (dot(outG, outG) < 1e-5) { col = bounce2; }
    else {
      float c = clamp(dot(r, n1), 0.0, 1.0); float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0); float Fs = f0 + (1.0 - f0) * pow(1.0 - c, 5.0);
      vec3 pw = vWPos + Rm * (p1 - o) * sc;
      vec3 bg = vec3(texture(tBG, projUV(pw + Rm * normalize(outR) * 1.6)).r, texture(tBG, projUV(pw + Rm * normalize(outG) * 1.6)).g, texture(tBG, projUV(pw + Rm * normalize(outB) * 1.6)).b);
      col = (1.0 - Fs) * bg * exp(-uAbsorb * uAbsorbK * t1 * sc) + Fs * bounce2; }
    // luminous core: a soft emitter at the centre, integrated along the first segment of the ray
    float tc = clamp(dot(-o, r), 0.0, t1); vec3 pc = o + r * tc; float d2 = dot(pc, pc) / (uCoreR * uCoreR * 1.44 * 1.44);
    col += uGlow * uCore * exp(-d2 * 1.8) * min(1.0, t1 / 1.2);
    vec3 Fr = EnvironmentBRDF(nW, vW, material.specularColor, material.specularF90, material.roughness);
    totalDiffuse = (1.0 - Fr) * col;
    // hover: igloo's frost, emissive = rim x rim colour + lattice x rim x 10 + lattice x frost^2; x2.5 because igloo blooms
    // its whole scene from a 0.2 threshold and Gem C blooms from 0.75, so the crackle reads as bright as igloo's
    if (uFrostOn > 0.5) { vec2 fuv = (uRest * vObj).xy / uFrostScale + 0.5; vec2 fg = texture(tFrost, fuv).rg; float lat = texture(tLat, fuv * uLatN).r;
      totalEmissiveRadiance += uFrostGain * (fg.y * uRim + lat * fg.y * 10.0 + lat * fg.x * fg.x); }
  `;
  return patch(m, U, {
    pars: 'uniform sampler2D tBG; uniform vec2 uRes; uniform float uIor, uNP, uAbsorbK, uCore, uCoreR; uniform vec4 uPlanes[32]; uniform vec3 uAbsorb, uGlow;\n' +
      'uniform sampler2D tFrost, tLat; uniform float uFrostOn, uFrostGain, uLatN, uFrostScale; uniform mat3 uRest; uniform vec3 uRim;\n' +
      'vec2 projUV(vec3 w) { vec4 c = projectionMatrix * viewMatrix * vec4(w, 1.0); return c.xy / c.w * 0.5 + 0.5; }',
    replace: { '#include <transmission_fragment>': MAIN, '#include <opaque_fragment>': 'gl_FragColor = vec4(neutralTone(max(outgoingLight, 0.0)), 1.0);' },
  });
}
