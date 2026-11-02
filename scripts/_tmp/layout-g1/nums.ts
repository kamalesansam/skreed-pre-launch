import { placeJar, streamRadius, LIQ, JAR, tiltFactor } from '../../../src/scripts/hero/section5/jars-math.ts';
const p390 = placeJar({ x: 222, y: 250, w: 152, h: 190 }, { w: 390, h: 844 });
const p1280 = placeJar({ x: 455.8, y: 296, w: 281.6, h: 352 }, { w: 1280, h: 800 });
const pG1 = placeJar({ x: 246.9, y: 195, w: 127.1, h: 158.85 }, { w: 390, h: 664 });
console.log('390', p390.px, p390.box, '1280', p1280.px, p1280.box, 'g1', pG1.px, pG1.box);
console.log('stream old', streamRadius(0.5) * 2 * 218.7, 'new', streamRadius(0.5) * 2 * p390.px);
console.log('seam old', LIQ.seam * 2 * 0.695 * 218.7, 'new', LIQ.seam * 2 * 0.695 * p390.px);
console.log('width bound 390', 152 / JAR.width, 'tilt', tiltFactor(10));
