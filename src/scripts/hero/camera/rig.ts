// The hero camera (prototype v11.4 template.html, the camera block of step(); frame step F11): the base pose from the
// scroll, igloo's parallax (0.07 and 0.025 of 90 degrees, eased at 0.035 a frame, from any active pointer, times live),
// the 0.01 shake, then lookAt. The sky dome follows the camera (it is at infinity).
// v11 (Sam, 2026-10-11): on the moon world the pull-back is a level curve that backs straight away while weaving
// (CAMX, 6 units each way), looking half-way between ahead and the logo; a 0.75 rise over the first third. The igloo
// intro cranes down from its start pose onto that base (crane.w, 0 at the start pose, 1 on the hero's base pose).
// Under reduced motion the v9.9 straight pull-back stays, with s = 0, so the camera holds the hero pose.
import { Vector2, Vector3, type Object3D, type PerspectiveCamera } from 'three';
import { CAMX, S2T } from '../../../config/hero.ts';
import { clamp01, lerpFPS, sineNoise } from '../util/math.ts';

export interface CameraRig {
  camFrom: Vector3; camTo: Vector3; tgtFrom: Vector3; tgtTo: Vector3;
  state: { theta: number; phi: number };
  update(f: RigFrame): void;
}

export interface RigFrame {
  s: number; t: number; ratio: number; live: number; reduced: boolean;
  /** the scroll follower's second stage, in screens (the curve's parameter) */
  b: number;
  /** the moon world's curved pull-back (v11); false keeps the straight v9.9 lerp */
  curve: boolean;
  /** the intro's crane: the base pose is blended from pos/tgt (w 0) to the scroll pose (w 1) */
  crane?: { w: number; pos: Vector3; tgt: Vector3 } | null;
  pointerActive: boolean; target: Vector2 | null;
  /** moves with the camera: the sky dome */
  follow?: Object3D | null;
}

/** The weave: x at curve parameter v, smoothstep between the CAMX keys (prototype camX). */
export function camX(v: number): number {
  for (let i = 1; i < CAMX.length; i++) if (v <= CAMX[i][0]) { const [v0, x0] = CAMX[i - 1], [v1, x1] = CAMX[i], t = (v - v0) / (v1 - v0);
    return x0 + (x1 - x0) * t * t * t * (t * (t * 6 - 15) + 10); }
  return CAMX[CAMX.length - 1][1];
}

/** The level curve (prototype camCurve): s 0..1 over the pull-back, u2 0..1 after it (the flights), both in v = s + u2. */
export function camCurve(s: number, u2: number, tgtY: number, outP: Vector3, outT: Vector3): void {
  const v = s + u2, x = camX(v), z = 24 + 20 * Math.min(v, 1) + 16 * Math.max(0, v - 1);
  const k = Math.min(1, v / 0.3), y = -2.5 + 0.75 * k * k * (3 - 2 * k);
  outP.set(x, y, z); outT.set(0.45 * x, tgtY, 0);
}

export function createCameraRig(camA: PerspectiveCamera): CameraRig {
  // the pre-world values of the prototype (line 543); applyMoonWorld sets the moon poses before the first frame
  const camFrom = new Vector3(0, 0, 19.25), camTo = new Vector3(0, 4.5, 34);
  const tgtFrom = new Vector3(0, -0.9, 0), tgtTo = new Vector3(0, -2.6, -2);
  const basePos = new Vector3(), baseTgt = new Vector3(), off = new Vector3(), right = new Vector3(), upv = new Vector3(), dir = new Vector3();
  const state = { theta: 0, phi: 0 };
  return {
    camFrom, camTo, tgtFrom, tgtTo, state,
    update(f) {
      const { s, t, ratio, live, reduced, pointerActive, target } = f;
      if (f.curve && !reduced) { const sc = clamp01(f.b / S2T.PULL); camCurve(sc * sc * (3 - 2 * sc), clamp01((f.b - S2T.PULL) / (S2T.LAND - S2T.PULL)), tgtFrom.y, basePos, baseTgt); }   // a gentle ease: no rush mid-way
      else { basePos.lerpVectors(camFrom, camTo, s); baseTgt.lerpVectors(tgtFrom, tgtTo, s); }
      if (f.crane && f.crane.w < 1) { basePos.lerpVectors(f.crane.pos, basePos, f.crane.w); baseTgt.lerpVectors(f.crane.tgt, baseTgt, f.crane.w); }   // the crane down from igloo's start pose
      const tx = pointerActive && !reduced ? target!.x * live : 0, ty = pointerActive && !reduced ? target!.y * live : 0;
      state.theta = lerpFPS(state.theta, tx * Math.PI * 0.5 * 0.07, 0.035, ratio);
      state.phi = lerpFPS(state.phi, -ty * Math.PI * 0.5 * 0.025, 0.035, ratio);
      off.subVectors(basePos, baseTgt); dir.copy(off).normalize();
      right.crossVectors(camA.up, dir).normalize(); upv.crossVectors(dir, right);
      off.applyAxisAngle(right, state.phi).applyAxisAngle(upv, state.theta);
      camA.position.copy(baseTgt).add(off);
      f.follow?.position.copy(camA.position);
      const sh = reduced ? 0 : 0.01 * live;
      const look = baseTgt.clone().sub(camA.position)
        .applyAxisAngle(right, sineNoise(-2.45, 4.789, 7.343 + t * 0.5) * sh).applyAxisAngle(upv, sineNoise(12.23, 3.44, -3.234 + t * 0.5) * sh);
      camA.lookAt(camA.position.clone().add(look)); camA.updateMatrixWorld();   // section 2 reads the camera's matrices this frame
    },
  };
}
