// Section 4's travel between the lands, option B (docs/specs/section-4-world.md 2 "Option B", 3 "Option B's park", 5
// "Build modes" and "Loading, in phases", 6; W6, W9): our own stylised, compressed Central Park (scripts/room/park.py,
// packed by scripts/room/pack.mjs park into src/assets/room/park/).
// - The travel: the land's picture cross-fades over 0.4 s into the park seen from the land's matched pose (park.json's,
//   ahead by the land's rest push as its picture is at rest), the camera flies park.json's flight to the next land's pose
//   (park-flight.ts: the path at easeInOutCubic of the time, the look at the time, the world's up so it never rolls, the
//   FOV and both exposures from their keys; tests/unit/room-park.test.ts and room-travel-park.test.ts hold the view at or
//   under 90 degrees a second over Tune's whole range), and the next picture cross-fades in over the last 0.4 s. Back flies
//   the same flight in reverse. A travel between lands whose poses are not neighbours (a land not approved between them)
//   has no flight: the director's 300 ms cross-fade. The length is landTravelMs, held to the flights' 2600 to 4500 ms.
// - Loading (spec 5, phase 3, on the press): park.glb (EXT_meshopt_compression, KHR_mesh_quantization, instanced trees)
//   through three's GLTFLoader with the vendored pure-JS meshopt decoder (no WebAssembly: the CSP has no
//   'wasm-unsafe-eval'), its buffer views decoded within about 2 ms of each frame; the lightmap, AVIF or WebP as the
//   island picked at boot, decoded off the main thread and uploaded in strips (sRGB, mipmapped, trilinear); then one program compiled
//   a frame and each mesh drawn once into an 8 px target a frame, so its buffers are on the GPU before the first travel.
//   Every fetch has the site's 20 s timeout and stops on dispose. A failed load leaves every travel the cross-fade, and on
//   Tune builds the land's text says so (note), so Sam can tell B apart from the fade.
// - Drawing: three writes linear values into a render target and world.ts's target holds display values (spec 5, "Its
//   target"), so the park's materials are ShaderMaterials that light as pack.mjs says and convert to sRGB by hand, as
//   hall.ts's do: 'lightmap' albedo x COLOR_0 x the map / unit x the scene's exposure, 'baked' COLOR_0 x the instance's
//   shade x the scene's exposure, 'unlit' (the sky, the skyline, the far ground) COLOR_0 x the sky's exposure. The park is
//   world.ts's 'draw' layer; the pictures are land layers over it at their fade's alpha. While the camera is fast the
//   lightmap is read at the level of detail whose texels span the ground it covers in 0.1 s (park-flight.ts blurAt), so
//   the elms' sun and shade bands on the Mall's path blur as a camera's would rather than flash (AC5).
// - The park's model, lightmap and JSON are imported here and nowhere else (travel-stub.ts's second rule), so a build
//   that did not pick B never carries them; Tune switching options disposes everything here.
import { InstancedMesh, Mesh, NoToneMapping, PerspectiveCamera, Scene, ShaderMaterial, SRGBColorSpace, Vector3, WebGLRenderTarget, type Material, type Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import parkGlbUrl from '../../../assets/room/park/park.glb?url';
import lightAvifUrl from '../../../assets/room/park/park-lightmap.avif?url';
import lightWebpUrl from '../../../assets/room/park/park-lightmap.webp?url';
import { camera as CAMERA, flights as FLIGHTS, lightmap as LIGHTMAP, poses as POSES, travel as TRAVEL } from '../../../assets/room/park/park.json';
import { ROOM_LANDS, type RoomParams } from '../../../config/room.ts';
import { MeshoptDecoder } from '../../family/three/vendor/meshopt-decoder-reference.js';
import { TO_SRGB } from './assets.ts';
import { blurAt, coverFov, createFlight, fadesAt, flown, legOf, parkMs, posesOfLands, type Flight, type ParkFlightJson } from './park-flight.ts';
import type { Travel, TravelContext } from './travel.ts';
import { decodeImage, stripUpload, type WorldLayer } from './world.ts';

/** the line under the land's text on a Tune build where the park did not load, so the cross-fade is not taken for B */
const PARK_BLOCKED = 'Park blocked';
/** ms of buffer-view decoding a frame, at least one view a frame (spec 5: one decode a frame) */
const DECODE_MS = 2;
const LIGHTS = ['lightmap', 'baked', 'unlit'] as const;
type Light = (typeof LIGHTS)[number];

const flights = (FLIGHTS as unknown as readonly ParkFlightJson[]).map(createFlight);
/** each land's pose (ROOM_LANDS by product id) */
const POSE_OF = posesOfLands(ROOM_LANDS, POSES);

// the park's three lights: a vertex colour and an instance's shade where the mesh has them, the lightmap on the
// lightmapped meshes (its UV is glTF's, origin top left; the image is decoded bottom row first, so v is flipped here),
// one exposure (the scene's, or the sky's on the unlit meshes), then display values for the 8-bit target
const PARK_VERT = /* glsl */`
  varying vec3 vCol;
  #ifdef PARK_LIGHTMAP
  varying vec2 vUv; varying vec3 vWorld;
  #endif
  void main() {
    vec3 c = vec3(1.0);
    #ifdef USE_COLOR
    c *= color;
    #endif
    #ifdef USE_INSTANCING_COLOR
    c *= instanceColor;
    #endif
    vCol = c;
    #ifdef PARK_LIGHTMAP
    vUv = vec2(uv.x, 1.0 - uv.y);
    #endif
    vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    #endif
    #ifdef PARK_LIGHTMAP
    vWorld = (modelMatrix * p).xyz;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }`;
const PARK_FRAG = /* glsl */`
  uniform vec3 uAlbedo; uniform float uExposure, uUnit, uBlur, uLightSize; uniform sampler2D tLight;
  varying vec3 vCol;
  #ifdef PARK_LIGHTMAP
  varying vec2 vUv; varying vec3 vWorld;
  #endif
  ${TO_SRGB}
  void main() {
    vec3 c = uAlbedo * vCol * uExposure;
    #ifdef PARK_LIGHTMAP
    // the map's own level of detail, raised to the level whose texels span uBlur metres of this surface (park-flight.ts
    // blurAt: the ground covered while the camera is fast), from the texels and the metres a pixel spans
    vec2 tx = dFdx(vUv) * uLightSize, ty = dFdy(vUv) * uLightSize;
    vec3 wx = dFdx(vWorld), wy = dFdy(vWorld);
    float t2 = max(dot(tx, tx), dot(ty, ty)), m2 = max(max(dot(wx, wx), dot(wy, wy)), 1e-12);
    float lod = max(0.5 * log2(max(t2, 1e-12)), log2(max(1.0, uBlur * sqrt(t2 / m2))));
    c *= textureLod(tLight, vUv, lod).rgb / uUnit;   // an sRGB texture: the GPU decodes it to linear on sampling
    #endif
    gl_FragColor = vec4(toSrgb(clamp(c, 0.0, 1.0)), 1.0);
  }`;

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const GONE = new Error('section 4: option B was disposed');

/** the GLB, fetched with the site's 20 s timeout (model-fetch.ts's pattern), stopped by signal */
async function fetchBuffer(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20_000), stop = () => ac.abort();
  if (signal.aborted) ac.abort();
  signal.addEventListener('abort', stop, { once: true });
  try {
    const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return await res.arrayBuffer();
  } finally { clearTimeout(t); signal.removeEventListener('abort', stop); }
}

/** the vendored decoder behind GLTFLoader's async path, its buffer views queued and decoded within DECODE_MS of each frame */
function steppedDecoder(signal: AbortSignal) {
  const queue: (() => void)[] = [];
  let pending = false;
  const pump = () => {
    pending = false;
    const t0 = performance.now();
    do queue.shift()!(); while (queue.length && performance.now() - t0 < DECODE_MS);
    if (queue.length) schedule();
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(pump); } };
  return {
    ...MeshoptDecoder,
    decodeGltfBufferAsync(count: number, stride: number, source: Uint8Array, mode: string, filter?: string): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        queue.push(() => {
          if (signal.aborted) { reject(GONE); return; }
          try { const out = new Uint8Array(count * stride); MeshoptDecoder.decodeGltfBuffer(out, count, stride, source, mode, filter); resolve(out); } catch (e) { reject(e); }
        });
        schedule();
      });
    },
  };
}

export function createTravel(ctx: TravelContext): Travel | null {
  if (ctx.reduced) return null;   // still3d: every travel is the cross-fade (spec 4), never created there
  const { renderer } = ctx;
  const scene = new Scene(), cam = new PerspectiveCamera(POSES[0].fov, 1, CAMERA.near, CAMERA.far);
  const U = { scene: { value: 1 }, sky: { value: 1 }, unit: { value: LIGHTMAP.unit }, blur: { value: 0 }, size: { value: LIGHTMAP.size }, tLight: { value: null as Texture | null } };
  const meshes: Mesh[] = [];
  let light: Texture | null = null, warmRt: WebGLRenderTarget | null = null;
  let ready = false, failed = false, disposed = false, loading: Promise<void> | null = null, curMs = 0;
  const ac = new AbortController();
  const alive = () => { if (disposed) throw GONE; };

  // the travel in hand: its flight, where on it, the two rest pushes and the pictures' aspect (draw reads them)
  const cur = { flight: null as Flight | null, tau: 0, push0: 0, push1: 0, picAspect: 1 };
  const pose = flown(), dir = new Vector3();
  const parkLayer: WorldLayer = {
    kind: 'draw',
    draw(r, w, h) {
      const f = cur.flight;
      if (!f || !ready) return;
      f.at(cur.tau, pose, cur.push0, cur.push1);
      const aspect = w / Math.max(1, h);
      cam.aspect = aspect; cam.fov = coverFov(pose.fov, cur.picAspect, aspect); cam.updateProjectionMatrix();
      cam.position.copy(pose.position); cam.up.set(0, 1, 0); cam.lookAt(dir.copy(pose.look)); cam.updateMatrixWorld();
      U.scene.value = pose.exposure; U.sky.value = pose.sky; U.blur.value = blurAt(f.speed(cur.tau, curMs || parkMs(ctx.params().landTravelMs, TRAVEL)));
      r.render(scene, cam);
    },
  };
  const fromLayer = { kind: 'land' as const, i: 0, push: 0, alpha: 1 }, toLayer = { kind: 'land' as const, i: 0, push: 0, alpha: 0 };
  const layers: WorldLayer[] = [];

  /** the park's materials for the meshes GLTFLoader made (MeshBasicMaterial with extras.light, pack.mjs park) */
  function material(m: Mesh): ShaderMaterial {
    const src = m.material as Material & { color?: { r: number; g: number; b: number }; userData: { light?: string } };
    const kind = src.userData.light as Light;
    if (!LIGHTS.includes(kind)) throw new Error(`section 4: park mesh ${m.name} has no light the park knows (${String(src.userData.light)})`);
    const albedo = kind === 'lightmap' && src.color ? new Vector3(src.color.r, src.color.g, src.color.b) : new Vector3(1, 1, 1);
    const mat = new ShaderMaterial({
      name: `park-${kind}`, vertexShader: PARK_VERT, fragmentShader: PARK_FRAG, side: src.side,
      defines: kind === 'lightmap' ? { PARK_LIGHTMAP: '' } : {}, vertexColors: !!m.geometry.attributes.color,
      uniforms: { uAlbedo: { value: albedo }, uExposure: kind === 'unlit' ? U.sky : U.scene, uUnit: U.unit, uBlur: U.blur, uLightSize: U.size, tLight: U.tLight },
    });
    src.dispose();
    return mat;
  }

  /** draw one object into the 8 px target with that target bound, NoToneMapping set, and the renderer's state restored */
  async function warm(only: Mesh | null, compileOnly: boolean) {
    const was = renderer.getRenderTarget(), tm = renderer.toneMapping;
    warmRt ??= new WebGLRenderTarget(8, 8, { depthBuffer: true });
    renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(warmRt);
    if (compileOnly && only) {
      const done = renderer.compileAsync(only, cam, scene);
      renderer.setRenderTarget(was); renderer.toneMapping = tm;
      await done;
      return;
    }
    for (const m of meshes) { m.visible = !only || m === only; m.frustumCulled = false; }
    renderer.render(scene, cam);
    for (const m of meshes) { m.visible = true; m.frustumCulled = true; }
    renderer.setRenderTarget(was); renderer.toneMapping = tm;
  }

  /** every GPU resource and object here (a failed or abandoned load leaves nothing behind) */
  function free() {
    for (const m of meshes) { m.geometry.dispose(); (m.material as Material).dispose(); if ((m as InstancedMesh).isInstancedMesh) (m as InstancedMesh).dispose(); }
    meshes.length = 0; scene.clear();
    light?.dispose(); light = null; U.tLight.value = null;
    warmRt?.dispose(); warmRt = null;
  }

  const api: Travel = {
    get ready() { return ready; }, get failed() { return failed; },
    get note() { return failed && import.meta.env.PUBLIC_TUNE === '1' ? PARK_BLOCKED : null; },
    load() {
      return (loading ??= (async () => {
        // both fetches at once; the lightmap decodes off the main thread while the GLB's views decode a few a frame
        const bmpJob = decodeImage(ctx.avif ? lightAvifUrl : lightWebpUrl, ac.signal);
        bmpJob.catch(() => {});   // handled where it is awaited; never an unhandled rejection while the GLB decodes
        let bmp: ImageBitmap | null = null;
        try {
          const buf = await fetchBuffer(parkGlbUrl, ac.signal); alive();
          const gltf = await new GLTFLoader().setMeshoptDecoder(steppedDecoder(ac.signal)).parseAsync(buf, ''); alive();
          gltf.scene.traverse((o) => { const m = o as Mesh; if (m.isMesh) meshes.push(m); });
          if (!meshes.length) throw new Error('section 4: park.glb has no meshes');
          for (const m of meshes) m.material = material(m);
          scene.add(gltf.scene);
          scene.updateMatrixWorld(true);
          scene.traverse((o) => { o.matrixAutoUpdate = false; });   // nothing in the park moves: its matrices are composed once
          await frame(); alive();
          // the lightmap: storage, then strips of rows, then the mip chain, one step a frame
          bmp = await bmpJob; alive();
          const up = stripUpload(renderer, bmp, { mipmaps: true });
          // before its storage is made: SRGB8_ALPHA8, decoded on sampling as hall.ts's lightmap. Trilinear only, no anisotropy:
          // the bake is soft, so 8x sharpened only the far shadows' edges, and it doubled the travel's cost under the
          // spec's SwiftShader probe (390 x 844 at DPR 1.25: 67 to 33 ms at half of 1 to 2)
          up.texture.colorSpace = SRGBColorSpace;
          light = up.texture;
          while (!up.step()) { await frame(); alive(); }
          U.tLight.value = light;
          await frame(); alive();
          // one program a frame (three keys them on the defines, the vertex colours and the instancing), then each mesh drawn once
          const seen = new Set<string>();
          for (const m of meshes) {
            const key = `${(m.material as ShaderMaterial).name}|${(m.material as ShaderMaterial).vertexColors}|${(m as InstancedMesh).isInstancedMesh ? 1 : 0}|${(m as InstancedMesh).instanceColor ? 1 : 0}`;
            if (seen.has(key)) continue;
            seen.add(key); await warm(m, true); await frame(); alive();
          }
          for (const m of meshes) { await warm(m, false); await frame(); alive(); }
          warmRt?.dispose(); warmRt = null;
          ready = true;
        } catch (e) {
          ready = false;
          if (!disposed) { failed = true; console.warn("section 4: option B's park did not load; every travel is the cross-fade", e); }   // a dispose's abort is no failure
          ac.abort(); free();
          if (bmp) bmp.close(); else void bmpJob.then((b) => b.close(), () => {});   // stripUpload closes it only once complete
        }
      })());
    },
    can(from, to) { return ready && !failed && !!legOf(POSE_OF, FLIGHTS, from, to); },
    ms(_from, _to, params: RoomParams) { return (curMs = parkMs(params.landTravelMs, TRAVEL)); },
    frame(from, to, p) {
      if (!ready || failed || disposed) return null;
      const leg = legOf(POSE_OF, FLIGHTS, from, to), a = ctx.view(from), b = ctx.view(to);
      if (!leg || !a || !b) return null;
      cur.flight = flights[leg.flight]; cur.tau = leg.reverse ? 1 - p : p; cur.picAspect = a.aspect;
      const pa = ctx.world.restPush(from), pb = ctx.world.restPush(to);
      cur.push0 = leg.reverse ? pb : pa; cur.push1 = leg.reverse ? pa : pb;
      const [fa, fb] = fadesAt(p, curMs || parkMs(ctx.params().landTravelMs, TRAVEL));
      layers.length = 0; layers.push(parkLayer);
      if (fa > 0) { fromLayer.i = from; fromLayer.push = pa; fromLayer.alpha = fa; layers.push(fromLayer); }
      if (fb > 0) { toLayer.i = to; toLayer.push = pb; toLayer.alpha = fb; layers.push(toLayer); }
      return layers;
    },
    end() { cur.flight = null; },
    dispose() { disposed = true; ready = false; cur.flight = null; ac.abort(); free(); },
  };
  return api;
}
