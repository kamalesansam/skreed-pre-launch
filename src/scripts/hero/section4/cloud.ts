// Section 4's points (docs/specs/section-4-world.md 2 "The particle morph", W8 and W12): one Points object of 65,536
// points (32,768 on touch) with no buffers at all, every point's place and colour computed in the vertex shader from
// gl_VertexID and one progress value, so there is no simulation, no float target and no worker (W8). Two modes:
// - the cloud: igloo's vanishing-point target kept as ours (W12), a ball of radius 0.2 S, denser at its
//   middle, each point in one of the ten key shades by its longitude (ten wedges, as the rings carry them), turned
//   slowly about its vertical axis by the caller;
// - the morph: each point leaves the cloud on a curved path, a swirl about the view axis that unwinds as it lands, the
//   frame's centre first, onto its cell of a jittered grid over the frame (never a regular dot grid, rule 43), taking
//   the cell's average colour from the picture's mip chain (textureLod at the cell's size in texels): an antialiased
//   mosaic of round, opaque points (rules 42 and 44), their landing size 1.6 cells, capped at 24 x DPR device px.
// Option A's stream (stream.ts) shares the cells (CELL_GLSL) and the round point (POINT_FRAG), in its own program,
// so it ships only with option A. The landing plane is held in view space a fixed distance ahead of whatever camera
// draws it, so the picture fills the frame through the glide's last creep and the push's first frames alike. Colours are
// display values (the world's target is read as sRGB): the shades as their hex numbers, the pictures untagged.
import { BufferGeometry, NormalBlending, Points, ShaderMaterial, Sphere, Vector2, Vector3, type Texture } from 'three';

export const CLOUD = Object.freeze({
  count: 65536, touchCount: 32768,
  /** the ball's radius, in units of the ring spacing S */
  radius: 0.2,
  /** its turn, radians a second (igloo's room turns at 0.75; ours waits, slowly) */
  spin: 0.2,
  /** a cloud point's diameter in CSS px seen from 5 scene units, the glide's end */
  px: 2.8,
  /** the cap on a point's diameter, CSS px (times the DPR) */
  capPx: 24,
  /** a landed point's diameter in cells, and its jitter inside the cell (a fraction of the cell) */
  size: 1.6, jitter: 0.6,
  /** the swirl at departure (radians, unwinding to 0 on landing) and the centre-first stagger: every point leaves at once, the frame's centre lands by 1 - spread of the morph and its corners at the end */
  swirl: 2.2, spread: 0.45,
  /** the landing plane's distance ahead of the camera (scene units; only its screen place matters) */
  plane: 1.0,
});

/** the share of a picture of aspect aPic (width over height) a frame of aspect aScreen shows, cover-fit and centred: uv scale about 0.5 */
export const coverScale = (aScreen: number, aPic: number): [number, number] => [Math.min(1, aScreen / aPic), Math.min(1, aPic / aScreen)];

/** the landing grid for n points on a w x h frame: columns, rows and the cell in device px */
export function cellGrid(n: number, w: number, h: number): { cols: number; rows: number; cell: number } {
  const cols = Math.max(1, Math.round(Math.sqrt((n * w) / h))), rows = Math.max(1, Math.floor(n / cols));
  return { cols, rows, cell: h / rows };
}

/** the landed points' total fill in screens on a w x h frame at a DPR (spec 6, "Frame cost": at most 2.5; the doubled-up extras counted) */
export const landedFill = (n: number, w: number, h: number, dpr: number): number => { const g = cellGrid(n, w, h), d = Math.min(g.cell * CLOUD.size, CLOUD.capPx * dpr); return (n * Math.PI * d * d) / 4 / (w * h); };

export interface PointsPicture { texture: Texture; /** width over height */ aspect: number }

export interface CloudPoints {
  readonly object: Points;
  readonly count: number;
  /** the cloud at rest in its own frame (the caller places and turns object) */
  cloud(): void;
  /** the morph at p, 0 to 1, onto pic filling a w x h frame (device px) */
  morph(p: number, pic: PointsPicture, w: number, h: number): void;
  /** the points' opacity (their fade after landing) */
  alpha(a: number): void;
  dispose(): void;
}

/**
 * A point's cell on the frame's jittered grid, as frame uv, shared with stream.ts: the point's own random numbers from
 * gl_VertexID (rnd(k), a PCG hash), and the extra points past cols x rows doubling up on a cell.
 */
export const CELL_GLSL = /* glsl */`
  uniform vec2 uGrid; uniform float uJitter;
  uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
  float rnd(int k) { return float(pcg(uint(gl_VertexID) * 8u + uint(k))) * (1.0 / 4294967296.0); }
  vec2 cellUv() {
    int cols = int(uGrid.x), i = gl_VertexID % (cols * int(uGrid.y));
    return (vec2(float(i % cols), float(i / cols)) + 0.5 + (vec2(rnd(4), rnd(5)) - 0.5) * uJitter) / uGrid;
  }`;

// the morph's flight eases away from rest (a smoothstep) and onto the cell decelerating (a cubic out), so the cloud opens
// at once and every point settles; ahead() takes a frame uv to a view-space point dist ahead of whatever camera draws
// it (the projection holds its FOV and zoom); the morph lands centre first with a swirl that unwinds on landing, the
// colour taken over the flight's middle
const VERT = /* glsl */`
  uniform float uMode, uP, uR, uPx, uCap, uAlpha, uLod, uCellPx, uSize, uSwirl, uSpread, uD, uAspect;
  uniform vec2 uCover; uniform vec3 uShades[10]; uniform sampler2D tPic;
  varying vec3 vCol; varying float vPx, vA;
  ${CELL_GLSL}
  float ease(float x) { float s = x * x * (3.0 - 2.0 * x); return 1.0 - pow(1.0 - s, 3.0); }
  vec3 ahead(vec2 suv, float dist) { vec2 n = suv * 2.0 - 1.0; return vec3(n.x * dist / projectionMatrix[0][0], n.y * dist / projectionMatrix[1][1], -dist); }
  void main() {
    float u = rnd(0), cz = rnd(1) * 2.0 - 1.0, ph = rnd(2) * 6.2831853, sz = sqrt(1.0 - cz * cz);
    vec3 col = uShades[int(mod(floor((ph / 6.2831853 + 0.05 * (rnd(3) - 0.5)) * 10.0), 10.0))];
    vec3 pos = (modelViewMatrix * vec4(vec3(sz * cos(ph), cz, sz * sin(ph)) * uR * pow(u, 0.45), 1.0)).xyz;
    float px = uPx * 5.0 / max(0.05, -pos.z);
    if (uMode > 0.5) {
      vec2 suv = cellUv(), n = suv * 2.0 - 1.0;
      float r = length(n * vec2(uAspect, 1.0)) / length(vec2(uAspect, 1.0));
      float l = clamp(uP / (1.0 - uSpread * (1.0 - r) - 0.04 * rnd(6)), 0.0, 1.0), e = ease(l);
      vec3 tgt = ahead(suv, uD);
      float th = uSwirl * (1.0 - e) * (0.85 + 0.3 * rnd(7)), c = cos(th), s = sin(th);
      tgt.xy = mat2(c, s, -s, c) * tgt.xy;
      pos = mix(pos, tgt, e);
      col = mix(col, textureLod(tPic, 0.5 + (suv - 0.5) * uCover, uLod).rgb, smoothstep(0.3, 0.8, e));
      px = mix(px, uCellPx * uSize, e);
    }
    vPx = clamp(px, 1.0, uCap); vCol = col; vA = uAlpha;
    gl_PointSize = vPx;
    gl_Position = projectionMatrix * vec4(pos, 1.0);
  }`;

/** round and opaque, the edge antialiased over about one device px (the cloud's, the morph's and the stream's) */
export const POINT_FRAG = /* glsl */`
  varying vec3 vCol; varying float vPx, vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0, a = vA * (1.0 - smoothstep(1.0 - 2.0 / vPx, 1.0, d));
    if (a < 0.01) discard;
    gl_FragColor = vec4(vCol, a);
  }`;

/** the mip level that averages a picture of width picW over one cell of a grid cols across, through its cover crop */
export const cellLod = (picW: number, cover: number, cols: number): number => Math.max(0, Math.log2(Math.max(1, (picW * cover) / cols)));
export const picWidth = (t: Texture | null): number => (t?.image as { width?: number } | null)?.width ?? 1024;

/** the points: shades as display values (ten, ROOM_BAYS order), count, the DPR (sizes and the cap) */
export function createPoints(o: { shades: Float32Array; count: number; dpr: number; radius: number }): CloudPoints {
  const U = {
    uMode: { value: 0 }, uP: { value: 0 }, uR: { value: o.radius }, uPx: { value: CLOUD.px * o.dpr }, uCap: { value: CLOUD.capPx * o.dpr }, uAlpha: { value: 1 },
    uLod: { value: 0 }, uCellPx: { value: 4 }, uSize: { value: CLOUD.size }, uJitter: { value: CLOUD.jitter }, uSwirl: { value: CLOUD.swirl }, uSpread: { value: CLOUD.spread }, uD: { value: CLOUD.plane }, uAspect: { value: 1 },
    uGrid: { value: new Vector2(1, 1) }, uCover: { value: new Vector2(1, 1) }, uShades: { value: o.shades }, tPic: { value: null as Texture | null },
  };
  const material = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: POINT_FRAG, transparent: true, depthWrite: false, blending: NormalBlending });
  // no attributes: the draw range is the count and every point is computed from its gl_VertexID
  const geometry = new BufferGeometry();
  geometry.setDrawRange(0, o.count);
  geometry.boundingSphere = new Sphere(new Vector3(), o.radius);
  const object = new Points(geometry, material);
  object.frustumCulled = false;
  return {
    object, count: o.count,
    cloud() { U.uMode.value = 0; material.depthTest = true; },
    morph(p, pic, w, h) {
      const cv = coverScale(w / h, pic.aspect), g = cellGrid(o.count, w, h);
      U.uMode.value = 1; U.uP.value = p; U.tPic.value = pic.texture; U.uCover.value.set(cv[0], cv[1]);
      U.uGrid.value.set(g.cols, g.rows); U.uCellPx.value = g.cell; U.uAspect.value = w / h; U.uLod.value = cellLod(picWidth(pic.texture), cv[0], g.cols);
      material.depthTest = false;   // in front of the tunnel by construction, drawn last
    },
    alpha(x) { U.uAlpha.value = x; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
