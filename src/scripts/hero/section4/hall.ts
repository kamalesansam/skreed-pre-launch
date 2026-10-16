// Section 4's entrance hall (docs/specs/section-4.md 2 and 5; the numbers from docs/specs/evidence/section-4-measurements.md).
// Our own model (src/assets/room/hall.glb, scripts/room/hall.py) lit by our own baked lightmap, drawn unlit: albedo times
// the light, with the measured seams and the concrete's grain procedural in the shader, the fixtures emissive, the
// door's seam of light brightening toward the door station. One pass into an 8-bit target, then the measured output
// pass (vignette that clips at the centre, colour split at the corners, bleach-bypass, grain) into the frame the
// composite reads as tB of the third wipe and as the whole frame after it. The camera walks the measured hall by the
// section's scroll progress; the pointer sways the head on laptops. Everything here renders under NoToneMapping into
// sRGB, as section 3's fog ground does; the hero's composer keeps its ACES.
import { Color, Mesh, MeshBasicMaterial, NoToneMapping, PerspectiveCamera, Scene, ShaderMaterial, SRGBColorSpace, Texture, Vector2, Vector3, WebGLRenderTarget, type Material, type Object3D, type WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import hallUrl from '../../../assets/room/hall.glb?url';
import lightAvifUrl from '../../../assets/room/hall-lightmap.avif?url';
import lightWebpUrl from '../../../assets/room/hall-lightmap.webp?url';
import { fsCam, fsScene } from '../section2/background.ts';
import { HALL, roomParams, type RoomParams } from '../../../config/room.ts';

export interface HallLook { yaw: number; pitch: number }

export interface HallScene {
  readonly started: boolean;
  readonly ready: boolean;
  readonly failed: boolean;
  /** the frame: sRGB colour, alpha 1 (the composite's tB in the third wipe, then the whole frame) */
  readonly out: Texture | null;
  /** fetch the model and the lightmap, build the scene, compile once into an 8 px target */
  load(): Promise<void>;
  /** device pixels, as section 2's and section 3's targets */
  resize(w: number, h: number): void;
  /** x: the camera's place along the hall (metres); look: the head's sway in degrees; nearDoor: 0 far to 1 at the station */
  update(x: number, look: HallLook, nearDoor: number, t: number, params: RoomParams): void;
  render(): void;
  /** a scene point to CSS pixels of the canvas, or null when behind the camera */
  project(p: readonly [number, number, number]): { x: number; y: number } | null;
  /** test hook state */
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface HallOptions { renderer: WebGLRenderer; avif: boolean; reduced: boolean }

const LIGHT_VERT = /* glsl */`
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w; }`;

// albedo x baked light (the lightmap is sRGB), the measured seams as dark lines in world space, the grain as a two-octave
// hash at a centimetre scale, then back to sRGB for the 8-bit target
const LIGHT_FRAG = /* glsl */`
  uniform sampler2D tLight; uniform float uExposure, uAlbedo, uSeams, uGrain;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  float hash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec3(1,0,0)), c = hash(i + vec3(0,1,0)), d = hash(i + vec3(1,1,0));
    float e = hash(i + vec3(0,0,1)), g = hash(i + vec3(1,0,1)), h = hash(i + vec3(0,1,1)), k = hash(i + vec3(1,1,1));
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z); }
  float groove(float d, float hw) { return 1.0 - smoothstep(hw, hw + 0.012, abs(d)); }
  void main() {
    vec3 light = texture2D(tLight, vUv).rgb * uExposure;   // the texture is sRGB: the GPU decodes it to linear on sampling
    // seams (evidence file 2.6): floor grooves every 0.66 m across the hall and one along it; wall grooves at 1.13, 2.23 and 3.23 m
    float seam = 0.0;
    if (vNormal.y > 0.9 && vWorld.y < 0.08) { seam = max(groove(mod(vWorld.x + 0.33, 0.66) - 0.33, 0.025), groove(vWorld.z - 0.92, 0.025)); }
    else if (abs(vNormal.z) > 0.9) { seam = max(max(groove(vWorld.y - 1.13, 0.025), groove(vWorld.y - 2.23, 0.025)), groove(vWorld.y - 3.23, 0.025)); }
    light *= 1.0 - uSeams * seam;
    float n = vnoise(vWorld * 90.0) * 0.6 + vnoise(vWorld * 310.0) * 0.4;
    light *= 1.0 + uGrain * (n - 0.5) * 2.0;
    gl_FragColor = vec4(toSrgb(clamp(light * uAlbedo, 0.0, 1.0)), 1.0);
  }`;

// the output pass (evidence file section 4; spec 2 "The look on screen"): the vignette multiplies before anything else so
// the centre clips to white in the 8-bit target; the split pulls red in and blue out by the square of the radius; the
// bleach-bypass overlays the pixel with its own luma; the grain is a per-frame hash. Normalised by the longer side so a
// portrait phone keeps the laptop's corners.
const POST_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FRAG = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uRes; uniform float uBoost, uCorners, uBleach, uSplit, uNoise, uFrame;
  varying vec2 vUv;
  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  void main() {
    vec2 d = (vUv - 0.5) * uRes / max(uRes.x, uRes.y);       // the corner of a 16:9 frame sits at |d| = 0.574
    float r = length(d);
    float vig = max(0.0, uBoost - (uBoost - uCorners) * (r / 0.574));
    vec2 off = d * r * uSplit / uRes;                         // grows with the square of the radius, zero at the centre
    vec3 c = vec3(texture2D(tSrc, vUv - off).r, texture2D(tSrc, vUv).g, texture2D(tSrc, vUv + off).b);
    c = min(c * vig, 1.0);
    float luma = dot(c, vec3(0.2125, 0.7154, 0.0721));
    float m = clamp((luma - 0.45) * 10.0, 0.0, 1.0);
    vec3 bleached = mix(2.0 * c * luma, 1.0 - 2.0 * (1.0 - c) * (1.0 - luma), m);
    c = mix(c, bleached, uBleach);
    c += uNoise * (0.5 - ign(gl_FragCoord.xy + vec2(uFrame * 7.0, uFrame * 3.0)));
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

async function loadLightmap(avif: boolean): Promise<Texture> {
  const url = avif ? lightAvifUrl : lightWebpUrl;
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`hall lightmap: HTTP ${res.status}`);
  const blob = await res.blob();
  // no flip: the UVs are glTF's (origin top left), so the image is used as stored
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const tex = new Texture(bitmap); tex.flipY = false; tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  return tex;
}

function loadModel(url: string): Promise<Object3D> {
  return new Promise((resolve, reject) => {
    fetch(url, { credentials: 'same-origin' }).then(async (res) => {
      if (!res.ok) throw new Error(`hall model: HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      new GLTFLoader().parse(buf, '', (g) => resolve(g.scene), reject);
    }).catch(reject);
  });
}

export function createHall(o: HallOptions): HallScene {
  const { renderer } = o;
  const scene = new Scene(); scene.background = new Color(1, 1, 1);   // the transept's open ends show white, as the reference clears to white
  const D = roomParams();
  const cam = new PerspectiveCamera(D.fov, 1, 0.05, 30);
  const U = { tLight: { value: null as Texture | null }, uExposure: { value: D.exposure }, uAlbedo: { value: D.albedo }, uSeams: { value: D.seams }, uGrain: { value: D.grain } };
  const litMat = new ShaderMaterial({ uniforms: U, vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG });
  const fixtureMat = new MeshBasicMaterial({ color: new Color(0.84, 0.89, 0.93).multiplyScalar(1.15) });   // cool white, clips white after the boost
  const spotMat = new MeshBasicMaterial({ color: new Color(0.72, 0.65, 0.51).multiplyScalar(1.25) });      // warm, about 4500 K
  const leafMat = new MeshBasicMaterial({ color: new Color(0x383f43) });                                   // Urban Slate in the scene, a render parameter
  const seamMat = new MeshBasicMaterial({ color: new Color(1, 1, 1) });
  const P = { tSrc: { value: null as Texture | null }, uRes: { value: new Vector2(1, 1) }, uBoost: { value: D.vignette }, uCorners: { value: D.corners }, uBleach: { value: D.bleach }, uSplit: { value: D.split }, uNoise: { value: D.noise }, uFrame: { value: 0 } };
  const postMat = new ShaderMaterial({ uniforms: P, vertexShader: POST_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false });
  const postScene = fsScene(postMat);
  let rtScene: WebGLRenderTarget | null = null, rtOut: WebGLRenderTarget | null = null, W = 1, H = 1, frameNo = 0;
  let started = false, ready = false, failed = false, model: Object3D | null = null, lightmap: Texture | null = null;
  const leaves: Mesh[] = []; let seamMesh: Mesh | null = null;
  const _cc = new Color(), _v = new Vector3();
  let curX: number = HALL.start, curNear = 0;

  function build(root: Object3D) {
    root.traverse((obj) => {
      const m = obj as Mesh; if (!m.isMesh) return;
      const n = m.name;
      if (/^fixture/.test(n)) m.material = fixtureMat;
      else if (/^spot/.test(n)) m.material = spotMat;
      else if (/^leaf/.test(n)) { m.material = leafMat; leaves.push(m); }
      else if (n === 'seam') { m.material = seamMat; seamMesh = m; }
      else m.material = litMat;
      m.frustumCulled = false;
    });
    scene.add(root);
  }

  const api: HallScene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return rtOut ? rtOut.texture : null; },
    async load() {
      if (started) return; started = true;
      try {
        const [root, tex] = await Promise.all([loadModel(hallUrl), loadLightmap(o.avif)]);
        model = root; lightmap = tex; U.tLight.value = tex;
        build(root);
        renderer.initTexture(tex);
        // compile with an 8 px target so the first real frame links nothing
        const w = W, h = H; api.resize(8, 8);
        api.update(HALL.start, { yaw: 0, pitch: 0 }, 0, 0, roomParams());
        await renderer.compileAsync(scene, cam);
        api.render();
        api.resize(w, h);
        ready = true;
      } catch (e) {
        failed = true;
        console.warn('section 4: the hall did not load; the stills stand in', e);
      }
    },
    resize(w, h) {
      W = Math.max(1, w); H = Math.max(1, h);
      rtScene?.dispose(); rtOut?.dispose();
      rtScene = new WebGLRenderTarget(W, H, { depthBuffer: true });
      rtOut = new WebGLRenderTarget(W, H, { depthBuffer: false });
      P.uRes.value.set(W, H);
      cam.aspect = W / H; cam.zoom = Math.min(1, cam.aspect * 1.25); cam.updateProjectionMatrix();   // the hero's portrait rule
    },
    update(x, look, nearDoor, t, params) {
      curX = x; curNear = nearDoor;
      if (cam.fov !== params.fov) { cam.fov = params.fov; cam.updateProjectionMatrix(); }
      cam.position.set(x, params.eye, 0);
      const yaw = (look.yaw * Math.PI) / 180, pitch = (look.pitch * Math.PI) / 180;
      // looking west down the hall (-x); yaw turns toward -z on the right (facing -x, right is -z), pitch lifts the gaze
      _v.set(-Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.sin(yaw) * Math.cos(pitch)).add(cam.position);
      cam.lookAt(_v);
      U.uExposure.value = params.exposure; U.uAlbedo.value = params.albedo; U.uSeams.value = params.seams; U.uGrain.value = params.grain;
      P.uBoost.value = params.vignette; P.uCorners.value = params.corners; P.uBleach.value = params.bleach; P.uSplit.value = params.split; P.uNoise.value = o.reduced ? 0 : params.noise; P.uFrame.value = t;
      // the seam of light brightens from 0.2 far out to the full glow at the station (spec section 4)
      if (seamMesh) seamMat.color.setScalar((0.2 + 0.8 * nearDoor) * params.seamGlow);
      for (const l of leaves) l.visible = params.door !== 2;
    },
    render() {
      if (!rtScene || !rtOut || !ready && !started) return;
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
      renderer.toneMapping = NoToneMapping;
      renderer.setRenderTarget(rtScene); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, cam);
      P.tSrc.value = rtScene.texture; P.uFrame.value = (frameNo++) % 4096;
      renderer.setRenderTarget(rtOut); renderer.render(postScene, fsCam);
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
    },
    project(p) {
      _v.set(p[0], p[1], p[2]).project(cam);
      if (_v.z > 1 || _v.z < -1) return null;
      const w = renderer.domElement.clientWidth || innerWidth, h = renderer.domElement.clientHeight || innerHeight;
      return { x: (_v.x * 0.5 + 0.5) * w, y: (-_v.y * 0.5 + 0.5) * h };
    },
    hooks() { return { started, ready, failed, x: +curX.toFixed(3), nearDoor: +curNear.toFixed(3), fov: cam.fov, size: [W, H] }; },
    dispose() {
      rtScene?.dispose(); rtOut?.dispose(); rtScene = rtOut = null;
      litMat.dispose(); postMat.dispose(); fixtureMat.dispose(); spotMat.dispose(); leafMat.dispose(); seamMat.dispose();
      lightmap?.dispose();
      model?.traverse((obj) => { const m = obj as Mesh; if (m.isMesh) { m.geometry.dispose(); } });
      if (model) scene.remove(model);
      model = null; ready = false;
    },
  };
  return api;
}

export type { Material };
