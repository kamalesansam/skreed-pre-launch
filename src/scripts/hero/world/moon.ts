// The moon world (prototype lines 557 to 560 and 879 to 894, the 'spires' branch only; the canyon and dunes plates are
// dropped): the group that holds the sky, the floor, the stones and the fog, and the world's settings: the poses, fog
// 60 to 430, background and fog #050506 (--night, exception E-A2).
import { Color, Fog, Group, type Scene } from 'three';
import { MOON_POSE, POSE } from '../../../config/hero.ts';
import { NIGHT } from '../../../config/tokens.ts';
import type { CameraRig } from '../camera/rig.ts';

export function createMoonGroup(): Group {
  const moon = new Group(); moon.visible = false;
  return moon;
}

/** The scene's fog and background start as night: the values setWorld('spires') leaves (prototype line 891). */
export function createSceneFog(): { background: Color; fog: Fog } {
  return { background: new Color(NIGHT), fog: new Fog(new Color(NIGHT), MOON_POSE.fogNear, MOON_POSE.fogFar) };
}

export function applyMoonWorld(scene: Scene, moon: Group, rig: CameraRig, pose: { cam: readonly number[]; tgt: readonly number[] } = POSE): void {
  moon.visible = true;
  rig.camFrom.fromArray(pose.cam as number[]); rig.tgtFrom.fromArray(pose.tgt as number[]);
  rig.camTo.fromArray(MOON_POSE.cam as unknown as number[]); rig.tgtTo.fromArray(MOON_POSE.tgt as unknown as number[]);
  const fog = scene.fog as Fog;
  fog.near = MOON_POSE.fogNear; fog.far = MOON_POSE.fogFar;
  (scene.background as Color).set(MOON_POSE.background); fog.color.set(MOON_POSE.background);
}
