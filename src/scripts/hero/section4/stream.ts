// Option A's stream (docs/specs/section-4-world.md 2 "Option A, the pictures in depth", 6 "Frame cost"): the grid of one
// land breaks into points that stream past the camera, and behind it each takes the next land's colour and place and
// settles there as the camera arrives at that land's rest pose. Only option A's travel module imports this file, so
// it ships in that chunk alone; world.ts draws it as a 'stream' layer and knows only its type.
// - The points are the cloud's (cloud.ts: no buffers, every point from gl_VertexID on its cell of the frame's jittered
//   grid), in their own program with the depth test and depth write on, so near points cover far ones whatever their
//   order (the layer clears the depth first).
// - Each end is seen through its own land camera (world.ts's landCamera: the land's cover-fit FOV, the push, and on the
//   departing land the travel's sway): a point starts on its cell of the first land as that land's grid draws it, and
//   ends on its cell of the next as the next land's grid draws it at its rest pose, whatever the two lands' FOVs.
// - Out: in the first land's view each point flies straight toward the camera and past it (its view z on a cubic in),
//   so it spreads out from the frame's centre as the camera flies through. In: in the next land's view it starts six
//   times as far along the axis, near the frame's centre, and comes in to its cell on a cubic out, spreading out to it
//   as the camera arrives; it fades in over the first tenth of that half. Each point leaves at its own moment within the
//   first 0.3 of the travel.
// - The fill (spec 6: at most 2.5 screens at any moment): a point grows as it nears the camera but never past twice its
//   landed size (nor 24 x DPR device px), and fades out within 0.3 units of the camera; a point with nothing to draw
//   (faded out, or its centre off the frame, where the GPU drops a point anyway) is put outside the clip volume, so every
//   point drawn counts toward the fill. tests/unit/room-world.test.ts replays the vertex shader on the CPU across the travel.
import { BufferGeometry, Matrix4, NormalBlending, PerspectiveCamera, Points, ShaderMaterial, Sphere, Vector2, Vector3, Vector4, type Texture } from 'three';
import { CELL_GLSL, CLOUD, POINT_FRAG, cellGrid, cellLod, coverScale, picWidth } from './cloud.ts';
import { LAND_CLIP, landCamera, type LandView } from './world.ts';

export const STREAM = Object.freeze({
  /** each point leaves within this share of the travel, and takes the rest to arrive */
  stagger: 0.3,
  /** how far behind the camera a departing point heads (view z, scene units), and how many times as far as its cell an arriving one starts */
  behind: 0.5, from: 6,
  /** the largest a point grows, in landed sizes, and the distance from the camera inside which it fades out (scene units) */
  grow: 2, near: 0.3,
});

/** one end of a stream: a resident land, the camera's push into it (scene units along its view) and its sway (yaw and pitch, degrees) */
export interface StreamEnd { view: LandView; push: number; sway?: readonly [number, number] }

export interface WorldStream {
  readonly object: Points;
  readonly count: number;
  /** the stream at p, 0 to 1, from one land to the next on a w x h frame (device px) */
  update(p: number, from: StreamEnd, to: StreamEnd, w: number, h: number): void;
  alpha(a: number): void;
  dispose(): void;
}

const VERT = /* glsl */`
  uniform float uP, uAlpha, uCap, uBase, uGrow, uNear, uStagger, uBehind, uFrom;
  uniform vec2 uLod, uHas, uCoverA, uCoverB; uniform vec4 uCapA, uCapB;
  uniform mat4 uViewA, uProjA, uViewB, uProjB;
  uniform sampler2D tA, tB, tDepthA, tDepthB;
  varying vec3 vCol; varying float vPx, vA;
  ${CELL_GLSL}
  vec3 land(vec2 suv, vec2 cover, vec4 cap, sampler2D depth, float has, out vec2 puv) {
    puv = 0.5 + (suv - 0.5) * cover;
    float d = has > 0.5 ? textureLod(depth, puv, 0.0).r : 1.0, z = 1.0 / mix(1.0 / cap.w, 1.0 / cap.z, d);
    return vec3((puv * 2.0 - 1.0) * cap.xy * z, -z);
  }
  void main() {
    vec2 suv = cellUv(), pa, pb;
    vec3 A = (uViewA * vec4(land(suv, uCoverA, uCapA, tDepthA, uHas.x, pa), 1.0)).xyz, B = (uViewB * vec4(land(suv, uCoverB, uCapB, tDepthB, uHas.y, pb), 1.0)).xyz, v;
    float l = clamp((uP - uStagger * rnd(6)) / (1.0 - uStagger), 0.0, 1.0), a = uAlpha, s, z0;
    if (l < 0.5) {
      s = 2.0 * l; v = vec3(A.xy, mix(A.z, uBehind, s * s * s)); z0 = A.z;
      gl_Position = uProjA * vec4(v, 1.0); vCol = textureLod(tA, pa, uLod.x).rgb;
    } else {
      s = 1.0 - pow(2.0 - 2.0 * l, 3.0); v = vec3(B.xy, mix(B.z * uFrom, B.z, s)); z0 = B.z;
      gl_Position = uProjB * vec4(v, 1.0); vCol = textureLod(tB, pb, uLod.y).rgb; a *= smoothstep(0.5, 0.55, l);
    }
    a *= smoothstep(0.0, uNear, -v.z);
    vPx = max(1.0, min(uBase * z0 / min(v.z, -0.001), min(uBase * uGrow, uCap))); vA = a;
    gl_PointSize = vPx;
    if (a < 0.01 || any(greaterThan(abs(gl_Position.xy), vec2(gl_Position.w)))) gl_Position = vec4(vec2(0.0), 2.0, 1.0);
  }`;

/** option A's stream points: as many as the cloud has (65,536, 32,768 on touch), sized for the DPR */
export function createStream(o: { count: number; dpr: number }): WorldStream {
  const m4 = () => ({ value: new Matrix4() }), v2 = () => ({ value: new Vector2(1, 1) }), v4 = () => ({ value: new Vector4(1, 1, 1, 10) }), tex = () => ({ value: null as Texture | null });
  const U = {
    uP: { value: 0 }, uAlpha: { value: 1 }, uCap: { value: CLOUD.capPx * o.dpr }, uBase: { value: 4 }, uGrow: { value: STREAM.grow }, uNear: { value: STREAM.near },
    uStagger: { value: STREAM.stagger }, uBehind: { value: STREAM.behind }, uFrom: { value: STREAM.from }, uGrid: v2(), uJitter: { value: CLOUD.jitter },
    uLod: v2(), uHas: v2(), uCoverA: v2(), uCoverB: v2(), uCapA: v4(), uCapB: v4(), uViewA: m4(), uProjA: m4(), uViewB: m4(), uProjB: m4(),
    tA: tex(), tB: tex(), tDepthA: tex(), tDepthB: tex(),
  };
  const material = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: POINT_FRAG, transparent: true, depthTest: true, depthWrite: true, blending: NormalBlending });
  const geometry = new BufferGeometry();
  geometry.setDrawRange(0, o.count);
  geometry.boundingSphere = new Sphere(new Vector3(), 1e4);
  const object = new Points(geometry, material);
  object.frustumCulled = false;
  const camA = new PerspectiveCamera(50, 1, LAND_CLIP[0], LAND_CLIP[1]), camB = new PerspectiveCamera(50, 1, LAND_CLIP[0], LAND_CLIP[1]);
  const end = (e: StreamEnd, c: PerspectiveCamera, aspect: number, cols: number, k: 0 | 1) => {
    const v = e.view, ty = Math.tan((v.fov * Math.PI) / 360), cv = coverScale(aspect, v.aspect), A = k === 0;
    landCamera(c, v, aspect, e.push, e.sway);
    (A ? U.uViewA : U.uViewB).value.copy(c.matrixWorldInverse); (A ? U.uProjA : U.uProjB).value.copy(c.projectionMatrix);
    (A ? U.uCapA : U.uCapB).value.set(ty * v.aspect, ty, v.near, v.far); (A ? U.uCoverA : U.uCoverB).value.set(cv[0], cv[1]);
    (A ? U.tA : U.tB).value = v.picture; (A ? U.tDepthA : U.tDepthB).value = v.depth;
    U.uHas.value.setComponent(k, v.depth ? 1 : 0); U.uLod.value.setComponent(k, cellLod(picWidth(v.picture), cv[0], cols));
  };
  return {
    object, count: o.count,
    update(p, from, to, w, h) {
      const g = cellGrid(o.count, w, h);
      U.uP.value = p; U.uGrid.value.set(g.cols, g.rows); U.uBase.value = g.cell * CLOUD.size;
      end(from, camA, w / h, g.cols, 0); end(to, camB, w / h, g.cols, 1);
    },
    alpha(a) { U.uAlpha.value = a; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
