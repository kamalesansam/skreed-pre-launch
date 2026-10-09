// The hero camera (prototype lines 1258 to 1261 and 1335 to 1348; frame step F11): the base pose by the pull-back s,
// igloo's parallax (0.07 and 0.025 of 90 degrees, eased at 0.035 a frame, from any active pointer, times live), the
// 0.01 shake, then lookAt. The sky dome follows the camera (it is at infinity).
import { Vector2, Vector3, type Object3D, type PerspectiveCamera } from 'three';
import { lerpFPS, sineNoise } from '../util/math.ts';

export interface CameraRig {
  camFrom: Vector3; camTo: Vector3; tgtFrom: Vector3; tgtTo: Vector3;
  state: { theta: number; phi: number };
  update(f: RigFrame): void;
}

export interface RigFrame {
  s: number; t: number; ratio: number; live: number; reduced: boolean;
  pointerActive: boolean; target: Vector2 | null;
  /** moves with the camera: the sky dome */
  follow?: Object3D | null;
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
      basePos.lerpVectors(camFrom, camTo, s); baseTgt.lerpVectors(tgtFrom, tgtTo, s);
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
      camA.lookAt(camA.position.clone().add(look));
    },
  };
}
