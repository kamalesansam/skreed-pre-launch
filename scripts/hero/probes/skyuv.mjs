// Which part of the sky texture can the hero camera ever see? Rays through a 41x41 NDC grid, for every aspect class, every scroll
// pull-back step and the parallax extremes (theta 0.07 x 90 deg, phi 0.025 x 90 deg, shake 0.01 rad), mapped into the sky dome's UV
// exactly as the scene builds it (SphereGeometry phiStart 1.5pi - 70deg, phiLength 140deg, thetaStart 30deg, thetaLength 70deg,
// scale.x -1, rotation.x -2.6deg, dome centred on the camera). Ground occlusion is ignored, so the lower bound is conservative.
import * as THREE from 'three';
const D = THREE.MathUtils.degToRad;
const camFrom = new THREE.Vector3(0, -2.5, 24), tgtFrom = new THREE.Vector3(0, -1, 0), camTo = new THREE.Vector3(0, 3.2, 36), tgtTo = new THREE.Vector3(0, -1.2, -6);
const skyLon = D(140), phiStart = Math.PI * 1.5 - skyLon / 2, thetaStart = D(30), thetaLen = D(70);
const dome = new THREE.Object3D(); dome.scale.x = -1; dome.rotation.x = D(-2.6); dome.updateMatrixWorld();
const inv = new THREE.Matrix4().copy(dome.matrixWorld).invert();
const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 1200);
const rows = [];
let gu0 = 1, gu1 = 0, gv0 = 1, gv1 = 0;
for (const [name, asp] of [['phone 9:21', 9 / 21], ['phone 390x844', 390 / 844], ['tablet 3:4', 0.75], ['tablet 4:3', 4 / 3], ['laptop 16:10', 1.6], ['desktop 16:9', 16 / 9], ['ultrawide 21:9', 21 / 9], ['super-ultrawide 32:9', 32 / 9]]) {
  let u0 = 1, u1 = 0, v0 = 1, v1 = 0;
  for (const s of [0, 0.25, 0.5, 0.75, 1]) for (const tx of [-1, 0, 1]) for (const ty of [-1, 0, 1]) for (const sh of [-1, 1]) {
    cam.aspect = asp; cam.zoom = Math.min(1, asp * 1.25); cam.updateProjectionMatrix();
    const basePos = new THREE.Vector3().lerpVectors(camFrom, camTo, s), baseTgt = new THREE.Vector3().lerpVectors(tgtFrom, tgtTo, s);
    const off = new THREE.Vector3().subVectors(basePos, baseTgt), dir = off.clone().normalize();
    const right = new THREE.Vector3().crossVectors(cam.up, dir).normalize(), upv = new THREE.Vector3().crossVectors(dir, right);
    off.applyAxisAngle(right, -ty * Math.PI * 0.5 * 0.025).applyAxisAngle(upv, tx * Math.PI * 0.5 * 0.07);
    cam.position.copy(baseTgt).add(off);
    const look = baseTgt.clone().sub(cam.position).applyAxisAngle(right, 0.01 * sh).applyAxisAngle(upv, 0.01 * sh);
    cam.lookAt(cam.position.clone().add(look)); cam.updateMatrixWorld();
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
      const p = new THREE.Vector3(i / 20 - 1, j / 20 - 1, 0.5).unproject(cam).sub(cam.position).normalize();
      const l = p.clone().transformDirection(inv);   // into the dome's local frame (scale and rotation; translation is the camera)
      const theta = Math.acos(Math.max(-1, Math.min(1, l.y))); let phi = Math.atan2(l.z, -l.x);
      while (phi < phiStart) phi += 2 * Math.PI; while (phi >= phiStart + 2 * Math.PI) phi -= 2 * Math.PI;
      const u = (phi - phiStart) / skyLon, v = 1 - (theta - thetaStart) / thetaLen;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;   // outside the dome: background colour
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    }
  }
  rows.push(`| ${name} | ${u0.toFixed(3)} to ${u1.toFixed(3)} | ${(140 * (u1 - u0)).toFixed(1)} deg | ${v0.toFixed(3)} to ${v1.toFixed(3)} (lat ${(-10 + 70 * v0).toFixed(1)} to ${(-10 + 70 * v1).toFixed(1)} deg) |`);
  gu0 = Math.min(gu0, u0); gu1 = Math.max(gu1, u1); gv0 = Math.min(gv0, v0); gv1 = Math.max(gv1, v1);
}
console.log('| aspect | u range | span | v range (texture rows from bottom) |\n|---|---|---|---|\n' + rows.join('\n'));
console.log(`all: u ${gu0.toFixed(3)}..${gu1.toFixed(3)}, v ${gv0.toFixed(3)}..${gv1.toFixed(3)}; fraction of texels ever visible ${((gu1 - gu0) * (gv1 - gv0) * 100).toFixed(1)}%`);
