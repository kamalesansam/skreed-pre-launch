// Section 4's land depth, made edge-aware (docs/specs/section-4-world.md 2 "A land, at rest", W13): the push into a land
// moves the camera along its view, and each point of the picture moves out from the picture's centre the more the
// nearer it is, so the displaced grid (world.ts) tore wherever a cell had near corners and far ones. The estimator's
// steps are soft ramps up to about ten texels wide whose near end lies inside the picture's own edge, so the cells on a
// ramp stretched the edge's pixels and folded them under the near side: a hard straight seam where the depth's edge was
// straight (land 1's trunk), a staircase of cells where it was not (land 3's sleeve). The grid now draws each land
// twice from a prepared copy of its depth map, three channels a texel:
// - Red, the depth the front pass's vertices take. Where the source changes by more than `edge` within `margin` texels
//   (a real edge; the ground, a face or a sleeve's curve change far less) the near side wins: the texel takes the
//   nearest depth within the margin, so the near side covers the ramp and the picture's edge on it, every cell on a
//   silhouette has near corners only and moves rigidly with what is in front, and no cell stretches across the step.
// - Where the near side lies further out from the centre (within `outward` of the line out through the texel), the push
//   uncovers what is behind it. There red falls from the near side toward the centre along that line, `slope` a texel,
//   so the gap opens over the background beside the silhouette (out of focus in every land), never across the
//   silhouette, and no cell's corners differ by more than 4 x slope (the cells two texels a side). A surface less steep
//   than the slope keeps its depth.
// - Anywhere else the near side moves over what is behind it, or slides along it, and the step stays sharp. Green is the
//   cut there, `cut` of the way up from the far side's own level (the farthest within `local` texels) to the near side's:
//   the front pass drops a fragment drawn above the cut whose own pixel's source depth (filtered at the picture's
//   resolution) lies below it, so the margin's sliver of what is behind falls away, and the silhouette is the source
//   depth's smooth contour, never the cells' staircase.
// - Blue, the depth the back pass's vertices take: red, but that far side's own level where the front pass may cut, so
//   the back pass carries what lies behind the silhouette at its own distance and shows it where the front pass cut
//   (drawn after the front pass and only where nothing as near was drawn, so a faded land blends each pixel once). A
//   texel the slope raised fills a gap, so it is never cut and the back pass takes it too.
// - Two passes: the margin over a disc of `margin` texels, then the slope along the lines out from the centre (the
//   FAN), REACH texels, far enough that a full step falls away inside them. The GPU makes them once a land into a target the
//   source's size; softenDepth is the same sum on the CPU, which tests/unit/room-world.test.ts runs in node.
import { LinearFilter, Mesh, NoColorSpace, RGBAFormat, Scene, ShaderMaterial, UnsignedByteType, WebGLRenderTarget, type Camera, type Texture, type WebGLRenderer } from 'three';
import { fsGeo } from '../section2/background.ts';

export const LAND_DEPTH = Object.freeze({
  /** a real edge: the source depth (disparity, 1 near and 0 far) changes by more than this within the margin */
  edge: 0.08,
  /** the texels the near side is carried past a real edge every way (the estimator's ramp lies inside the picture's edge) */
  margin: 8,
  /** how fast an uncovering step falls toward the picture's centre, disparity a texel */
  slope: 0.02,
  /** where an edge that is not uncovering is cut, as a share of the way up from its far side to its near */
  cut: 0.25,
  /** the texels within which the far side's own level is read (the cut's and the back pass's), short of the margin so a
   *  surface between the near side and a farther one (a chin above a held phone) is cut to its own level, not the farthest */
  local: 3,
  /** a near neighbour lies further out from the centre (its edge uncovers this texel) when the cosine of its angle to
   *  the line out through the texel is above this; any other neighbour's edge is cut, the ones the push slides along too */
  outward: 0.5,
});
/** the texels the slope pass reads outward: a full step (1) falls away inside them */
export const REACH = Math.ceil(1 / LAND_DEPTH.slope);
/** the slope pass's lines, turned from the line out from the centre by these angles (degrees): the uncovered strip's sides fall away too, as a near side's corner seen at a slant, never a step across them */
export const FAN = Object.freeze([-30, -15, 0, 15, 30] as const);

/** a prepared texel: the front depth, the cut, the back depth */
export type Prepared = [number, number, number];

/**
 * The margin pass at one texel: raw(dx, dy) the source at that offset in texels, (rx, ry) the texel's place from the
 * map's centre in texels (a neighbour at o lies further out when o . r > outward |o| |r|).
 */
export function marginTexel(raw: (dx: number, dy: number) => number, rx: number, ry: number): Prepared {
  const { edge, margin, cut, local } = LAND_DEPTH, own = raw(0, 0);
  let lo = own, hi = own, over = 0, near = own;
  for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) {
    const n = dx * dx + dy * dy;
    if (n > margin * margin) continue;
    const r = raw(dx, dy);
    lo = Math.min(lo, r); hi = Math.max(hi, r);
    if (n <= local * local) near = Math.min(near, r);
    if (dx * rx + dy * ry < LAND_DEPTH.outward * Math.sqrt(n) * Math.hypot(rx, ry)) over = Math.max(over, r);
  }
  if (hi - lo <= edge) return [own, 0, own];
  return over - near > edge ? [hi, near + cut * (over - near), near] : [hi, 0, hi];
}
/** the slope pass at one texel: front(k, s) the margin pass's red s texels out along line k of the FAN (s 0 the texel itself) */
export function slopeTexel(own: Prepared, front: (k: number, s: number) => number): Prepared {
  let d = own[0];
  for (let k = 0; k < FAN.length; k++) for (let j = 1; j <= REACH; j++) d = Math.max(d, front(k, j) - LAND_DEPTH.slope * j);
  return d > own[0] ? [d, 0, d] : own;
}

/** the prepared copy of a w x h map (values 0 to 1, row by row) as the GPU's two passes make it: edge texels repeated, the lines out from the centre read with linear filtering */
export function softenDepth(raw: ArrayLike<number>, w: number, h: number): { front: Float32Array; cut: Float32Array; back: Float32Array } {
  const at = (a: ArrayLike<number>, x: number, y: number) => a[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const lin = (a: ArrayLike<number>, x: number, y: number) => {
    const fx = Math.min(w - 0.5, Math.max(0.5, x)) - 0.5, fy = Math.min(h - 0.5, Math.max(0.5, y)) - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    return (at(a, x0, y0) * (1 - tx) + at(a, x0 + 1, y0) * tx) * (1 - ty) + (at(a, x0, y0 + 1) * (1 - tx) + at(a, x0 + 1, y0 + 1) * tx) * ty;
  };
  const m = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = marginTexel((dx, dy) => at(raw, x + dx, y + dy), x + 0.5 - w / 2, y + 0.5 - h / 2);
    for (let c = 0; c < 3; c++) m[c][y * w + x] = t[c];
  }
  const out = { front: new Float32Array(w * h), cut: new Float32Array(w * h), back: new Float32Array(w * h) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const rx = x + 0.5 - w / 2, ry = y + 0.5 - h / 2, n = Math.hypot(rx, ry), ux = n > 0.5 ? rx / n : 0, uy = n > 0.5 ? ry / n : 0, k = y * w + x;
    const t = slopeTexel([m[0][k], m[1][k], m[2][k]], (f, s) => { const a = (FAN[f] * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a); return lin(m[0], x + 0.5 + (ux * c - uy * sn) * s, y + 0.5 + (ux * sn + uy * c) * s); });
    out.front[k] = t[0]; out.cut[k] = t[1]; out.back[k] = t[2];
  }
  return out;
}

const VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
// the margin pass, marginTexel's sum over the disc
const MARGIN_FRAG = /* glsl */`
  uniform sampler2D tRaw;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy), top = textureSize(tRaw, 0) - 1;
    vec2 r = gl_FragCoord.xy - 0.5 * vec2(top + 1);
    float own = texelFetch(tRaw, p, 0).r, lo = own, hi = own, over = 0.0, near = own, e = ${LAND_DEPTH.edge.toFixed(4)};
    for (int dy = -${LAND_DEPTH.margin}; dy <= ${LAND_DEPTH.margin}; dy++) for (int dx = -${LAND_DEPTH.margin}; dx <= ${LAND_DEPTH.margin}; dx++) {
      int n = dx * dx + dy * dy;
      if (n > ${LAND_DEPTH.margin * LAND_DEPTH.margin}) continue;
      float v = texelFetch(tRaw, clamp(p + ivec2(dx, dy), ivec2(0), top), 0).r;
      lo = min(lo, v); hi = max(hi, v);
      if (n <= ${LAND_DEPTH.local * LAND_DEPTH.local}) near = min(near, v);
      if (dot(vec2(dx, dy), r) < ${LAND_DEPTH.outward.toFixed(4)} * sqrt(float(n)) * length(r)) over = max(over, v);
    }
    gl_FragColor = hi - lo <= e ? vec4(own, 0.0, own, 1.0) : over - near > e ? vec4(hi, near + ${LAND_DEPTH.cut.toFixed(4)} * (over - near), near, 1.0) : vec4(hi, 0.0, hi, 1.0);
  }`;
// the slope pass, slopeTexel's sum along the FAN's lines out from the centre (tSrc the margin pass, linearly filtered)
const SLOPE_FRAG = /* glsl */`
  uniform sampler2D tSrc;
  void main() {
    vec2 size = vec2(textureSize(tSrc, 0)), r = gl_FragCoord.xy - 0.5 * size, u = length(r) > 0.5 ? normalize(r) : vec2(0.0);
    vec3 own = texelFetch(tSrc, ivec2(gl_FragCoord.xy), 0).rgb;
    float d = own.r;
    for (int k = 0; k < ${FAN.length}; k++) {
      float a = radians(${FAN[0].toFixed(1)} + ${(FAN[1] - FAN[0]).toFixed(1)} * float(k));
      vec2 f = mat2(cos(a), sin(a), -sin(a), cos(a)) * u;
      for (int j = 1; j <= ${REACH}; j++) d = max(d, textureLod(tSrc, (gl_FragCoord.xy + f * float(j)) / size, 0.0).r - ${LAND_DEPTH.slope.toFixed(4)} * float(j));
    }
    gl_FragColor = vec4(d > own.r ? vec3(d, 0.0, d) : own, 1.0);
  }`;

export interface DepthPrep {
  /** the passes' quads and scenes, for the world's compile steps */
  readonly steps: readonly { mesh: Mesh; scene: Scene }[];
  /** the prepared copy of src (w x h texels: red the front depth, green the cut, blue the back depth) in a new target, linearly filtered; the caller disposes it */
  run(src: Texture, w: number, h: number, camera: Camera): WebGLRenderTarget;
  dispose(): void;
}

export function createDepthPrep(renderer: WebGLRenderer): DepthPrep {
  const U = { tSrc: { value: null as Texture | null }, tRaw: { value: null as Texture | null } };
  const steps = [MARGIN_FRAG, SLOPE_FRAG].map((fragmentShader) => {
    const mesh = new Mesh(fsGeo, new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader, depthTest: false, depthWrite: false, toneMapped: false }));
    const scene = new Scene(); mesh.frustumCulled = false; scene.add(mesh);
    return { mesh, scene };
  });
  const target = (w: number, h: number) => { const t = new WebGLRenderTarget(w, h, { format: RGBAFormat, type: UnsignedByteType, depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter, generateMipmaps: false }); t.texture.colorSpace = NoColorSpace; return t; };
  return {
    steps,
    run(src, w, h, camera) {
      const margin = target(w, h), out = target(w, h), was = renderer.getRenderTarget();
      U.tRaw.value = src; renderer.setRenderTarget(margin); renderer.render(steps[0].scene, camera);
      U.tSrc.value = margin.texture; renderer.setRenderTarget(out); renderer.render(steps[1].scene, camera);
      renderer.setRenderTarget(was); U.tSrc.value = U.tRaw.value = null; margin.dispose();
      return out;
    },
    dispose() { for (const s of steps) (s.mesh.material as ShaderMaterial).dispose(); },
  };
}
