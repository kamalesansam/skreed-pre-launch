// Criterion 1 (family-page.md 24.4): each shipped model's back and its inside, rendered through three r165 and the site's own
// meshopt decoder in a page of ours (served from the worktree by route interception), on the GPU. The inside view looks at
// the back's inner face, where the supplier's hexagon and lettering stood in Sam's files.
//   node render-models.mjs <outdir>
import { readFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { WT, launch } from './lib.mjs';
const OUT = process.argv[2] || join(WT, 'docs/specs/screenshots');
mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(readFileSync(join(WT, 'src/data/case-model.json'), 'utf8'));
const MODELS = [['tough', manifest], ['magtough', manifest.magtough], ['snap', manifest.snap], ['armor', manifest.armor]];
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const HTML = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#383F43}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<canvas id="c" width="900" height="900"></canvas>
<script type="module">
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/vendor/meshopt-decoder-reference.js';
const renderer = new T.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(900, 900, false);
const scene = new T.Scene();
scene.background = new T.Color(0x383f43);
scene.add(new T.HemisphereLight(0xffffff, 0x223344, 1.4));
const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(2, 3, 4); scene.add(key);
const fill = new T.DirectionalLight(0xffffff, 1.0); fill.position.set(-3, -1, -2); scene.add(fill);
const cam = new T.PerspectiveCamera(28, 1, 0.01, 100);
let group = null;
window.__load = async (url, shade) => {
  if (group) scene.remove(group);
  const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  const root = g.scene, names = [];
  root.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(root), size = new T.Vector3(), centre = new T.Vector3();
  box.getSize(size); box.getCenter(centre);
  group = new T.Group();
  root.position.sub(centre);
  group.add(root);
  group.scale.setScalar(1 / size.y);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const c = o.material.color.getHexString();
    names.push(o.name + ':' + o.material.name + ':#' + c);
    const role = o.name;
    const col = role === 'trim' ? o.material.color : new T.Color(role === 'logo' ? 0xffffff : shade);
    if (role === 'logo') col.multiplyScalar(0.8468).multiply(new T.Color(shade));
    o.material = new T.MeshStandardMaterial({ color: col, roughness: role === 'trim' ? 0.7 : 0.55, metalness: 0, side: T.DoubleSide });
  });
  scene.add(group);
  return { size: size.toArray(), names };
};
window.__shot = (view) => {
  // the model is height 1, centred; the back faces +Z, the window is at +Y
  if (view === 'back') { cam.position.set(0, 0, 2.6); cam.lookAt(0, 0, 0); }
  if (view === 'back-turned') { cam.position.set(1.45, 0.25, 2.15); cam.lookAt(0, 0, 0); }
  if (view === 'inside') { cam.position.set(0, 0, -2.6); cam.lookAt(0, 0, 0); }
  if (view === 'inside-low') { cam.position.set(0.0, -0.9, -2.3); cam.lookAt(0, -0.2, 0); }
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
};
window.__ready = true;
</script>`;
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
await ctx.route('https://r6.local/**', (route) => {
  const p = new URL(route.request().url()).pathname;
  if (p === '/') return route.fulfill({ status: 200, contentType: 'text/html', body: HTML });
  let file = null;
  if (p.startsWith('/three/')) file = join(WT, 'node_modules/three', p.slice(7));
  else if (p.startsWith('/vendor/')) file = join(WT, 'src/scripts/family/three/vendor', p.slice(8));
  else if (p.startsWith('/models/')) file = join(WT, 'public', p);
  try { return route.fulfill({ status: 200, contentType: MIME[extname(file)] || 'application/octet-stream', body: readFileSync(file) }); }
  catch { return route.fulfill({ status: 404, body: '' }); }
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('page error', e));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
await page.goto('https://r6.local/');
await page.waitForFunction(() => window.__ready, null, { timeout: 30_000 });
const SHADE = 0x0040c1;   // Blissful Blue Royal, the family page's reviewed family
for (const [type, entry] of MODELS) {
  const info = await page.evaluate(([u, s]) => window.__load(u, s), [entry.lod0, SHADE]);
  console.log(type, entry.lod0, 'parts', info.names.join(' | '), 'size', info.size.map((v) => v.toFixed(4)).join(' x '));
  for (const view of ['back', 'back-turned', 'inside', 'inside-low']) {
    const url = await page.evaluate((v) => window.__shot(v), view);
    const file = join(OUT, `family-r6-model-${type}-${view}.png`);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('  ', file);
  }
}
await browser.close();
