// Section 4's entrance hall (docs/specs/section-4.md 2 and 5; the numbers from docs/specs/evidence/section-4-measurements.md).
// Our own model (src/assets/room/hall.glb, scripts/room/hall.py) lit by our own baked lightmap, drawn unlit: albedo times
// the light, with the measured seams and the concrete's grain procedural in the shader, the fixtures emissive, the
// door's seam of light brightening toward the door station, the leaves on hinges for the transition. One pass into an
// 8-bit target, then the measured output pass (post.ts) into the frame the composite reads as tB of the third wipe and
// as the whole frame after it. The camera walks the measured hall by the section's scroll progress; the pointer sways
// the head on laptops. Everything here renders under NoToneMapping into sRGB, as section 3's fog ground does. From the
// press (section-4-world.md 2, "The press") the clear colour is Urban Slate, so the doorway behind the opening leaves
// reads dark, not white; the director stops drawing the hall once its glide ends and reuses its last frame as the
// bubble's outside.
import { Color, CubeCamera, Group, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, NoToneMapping, PerspectiveCamera, Scene, ShaderMaterial, Texture, Vector3, WebGLCubeRenderTarget, WebGLRenderTarget, type CubeTexture, type Object3D, type WebGLRenderer } from 'three';
import hallUrl from '../../../assets/room/hall.glb?url';
import lightAvifUrl from '../../../assets/room/hall-lightmap.avif?url';
import lightWebpUrl from '../../../assets/room/hall-lightmap.webp?url';
import { HALL, RENDER_COLOURS, roomParams, type RoomParams } from '../../../config/room.ts';
import { LIGHT_VERT, TO_SRGB, loadLightmap, loadModel } from './assets.ts';
import { createOutputPass } from './post.ts';

/** the head: yaw and pitch in degrees (the pointer's sway, the keys' turn, the drag); anchorYaw the part the prompt keeps (the keys and the drag, not the sway) */
export interface HallLook { yaw: number; pitch: number; anchorYaw?: number }

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
  /** the door: s 0 closed to 1 open; mode 0 two leaves swinging inward 95 degrees, 1 one slab sliding aside, 2 no door */
  swing(s: number, mode: number): void;
  /** from the press (true) the clear colour is Urban Slate; back in the hall (false) white again */
  entering(on: boolean): void;
  render(): void;
  /** a scene point to CSS pixels of the canvas, or null when behind the camera */
  project(p: readonly [number, number, number]): { x: number; y: number } | null;
  /** test hook state */
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface HallOptions { renderer: WebGLRenderer; avif: boolean; reduced: boolean; /** touch devices get no bloom (spec 2: on laptops) */ touch?: boolean }

// albedo x baked light (the lightmap is sRGB), the measured seams as dark lines in world space, the grain as a two-octave
// hash at a centimetre scale, then back to sRGB for the 8-bit target; on the floor, our own cube of the hall (rendered once
// from its centre and box-projected) reflected at a fifth face-on and two fifths at a grazing angle (spec 2 and 5)
const LIGHT_FRAG = /* glsl */`
  uniform sampler2D tLight; uniform samplerCube tEnv; uniform float uExposure, uAlbedo, uSeams, uGrain, uEnvOn, uGloss;
  uniform vec3 uBoxMin, uBoxMax, uCubePos;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  ${TO_SRGB}
  vec3 boxDir(vec3 p, vec3 r) {   // the reflected ray's hit on the hall's box, seen from the cube's centre
    vec3 f1 = (uBoxMax - p) / r, f2 = (uBoxMin - p) / r, fm = max(f1, f2);
    return p + r * min(min(fm.x, fm.y), fm.z) - uCubePos;
  }
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
    vec3 c = toSrgb(clamp(light * uAlbedo, 0.0, 1.0));
    if (uEnvOn > 0.5 && vNormal.y > 0.9 && vWorld.y < 0.08) {
      vec3 V = normalize(vWorld - cameraPosition), R = reflect(V, vec3(0.0, 1.0, 0.0));
      float F = uGloss * (0.2 + 0.2 * pow(1.0 - max(-V.y, 0.0), 2.0)) * (1.0 - 0.7 * seam);
      vec3 env = textureCube(tEnv, boxDir(vWorld, R), 1.5).rgb;   // the cube holds display values, as this target does
      c = mix(c, env, F);
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

const SWING_DEG = 95, SLAB_SLIDE = 1.62;

export function createHall(o: HallOptions): HallScene {
  const { renderer } = o;
  const scene = new Scene(); scene.background = new Color(...RENDER_COLOURS.hallClear);   // the transept's open ends show white, as the reference clears to white
  const D = roomParams();
  const cam = new PerspectiveCamera(D.fov, 1, 0.05, 30);
  const U = {
    tLight: { value: null as Texture | null }, uExposure: { value: D.exposure }, uAlbedo: { value: D.albedo }, uSeams: { value: D.seams }, uGrain: { value: D.grain },
    tEnv: { value: null as CubeTexture | null }, uEnvOn: { value: 0 }, uGloss: { value: D.gloss },
    uBoxMin: { value: new Vector3(HALL.xWest, 0, -HALL.width / 2) }, uBoxMax: { value: new Vector3(HALL.xEast, HALL.height, HALL.width / 2) }, uCubePos: { value: new Vector3(0, 1.2, 0) },
  };
  // the floor's reflection: one 128 px cube from the hall's centre, rendered once after the hall loads (mipmapped for a soft gloss)
  const cubeRT = new WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
  const cubeCam = new CubeCamera(0.05, 30, cubeRT); cubeCam.position.copy(U.uCubePos.value); scene.add(cubeCam);
  const litMat = new ShaderMaterial({ uniforms: U, vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG });
  const fixtureMat = new MeshBasicMaterial({ color: new Color(...RENDER_COLOURS.fixture) });   // cool white, about 7400 K; clips white after the boost
  const spotMat = new MeshBasicMaterial({ color: new Color(...RENDER_COLOURS.floorLight) });   // warm, about 4500 K
  // Urban Slate as display values: a MeshBasicMaterial writes linear into a render target and this target is read as sRGB,
  // so the colour is given as the hex's own numbers (a hex given to three's Color is decoded to linear and would read near black)
  const leafMat = new MeshBasicMaterial({ color: new Color(RENDER_COLOURS.leaf[0], RENDER_COLOURS.leaf[1], RENDER_COLOURS.leaf[2]) });
  const seamMat = new MeshBasicMaterial({ color: new Color(1, 1, 1) });
  const post = createOutputPass(renderer);
  let rtScene: WebGLRenderTarget | null = null, W = 1, H = 1, wantW = 1, wantH = 1, warming = false, cubeDone = false;
  let started = false, ready = false, failed = false, model: Object3D | null = null, lightmap: Texture | null = null;
  // each leaf on a hinge group at its jamb (the leaves' vertices are in world space, so the mesh is offset back by the hinge)
  const hinges: { group: Group; sign: number; z0: number }[] = []; let seamMesh: Mesh | null = null;
  const _cc = new Color(), _v = new Vector3();
  const CLEAR = new Color(...RENDER_COLOURS.hallClear), CLEAR_ENTERING = new Color(...RENDER_COLOURS.hallEntering);   // white: the hall's open ends; Urban Slate from the press
  let clear = CLEAR;
  const anchorCam = new PerspectiveCamera(D.fov, 1, 0.05, 30);   // the camera without the pointer's sway, for the prompt's anchor
  let curX: number = HALL.start, curNear = 0, curSwing = 0;

  function build(root: Object3D) {
    const leaves: Mesh[] = [];
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
    for (const leaf of leaves) {
      leaf.geometry.computeBoundingBox();
      const b = leaf.geometry.boundingBox!;
      // the jamb is the leaf's far edge from the seam: the left leaf (named for the visitor) sits at +z, its hinge at the +z jamb
      const atPlusZ = b.max.z > 0.1;
      const hinge = new Vector3((b.min.x + b.max.x) / 2, 0, atPlusZ ? b.max.z : b.min.z);
      const group = new Group(); group.position.copy(hinge);
      leaf.parent?.remove(leaf); leaf.position.copy(hinge).negate(); group.add(leaf); scene.add(group);
      hinges.push({ group, sign: atPlusZ ? 1 : -1, z0: hinge.z });
    }
  }

  function alloc(w: number, h: number) {
    W = w; H = h;
    rtScene?.dispose();
    rtScene = new WebGLRenderTarget(W, H, { depthBuffer: true });
    post.resize(W, H);
    cam.aspect = W / H; cam.zoom = Math.min(1, cam.aspect * 1.25); cam.updateProjectionMatrix();   // the hero's portrait rule
    anchorCam.copy(cam);
  }

  const api: HallScene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return post.out; },
    async load() {
      if (started) return; started = true;
      try {
        const [root, tex] = await Promise.all([loadModel(hallUrl, 'hall'), loadLightmap(lightAvifUrl, lightWebpUrl, o.avif, 'hall')]);
        model = root; lightmap = tex; U.tLight.value = tex;
        build(root);
        renderer.initTexture(tex);
        // compile with an 8 px target bound (three keys each program on the target: compiling with none would build the
        // canvas's sRGB and ACES variants), and keep any resize that lands meanwhile for the end
        warming = true; alloc(8, 8);
        api.update(HALL.start, { yaw: 0, pitch: 0 }, 0, 0, roomParams());
        renderer.setRenderTarget(rtScene); const compiling = renderer.compileAsync(scene, cam); renderer.setRenderTarget(null);
        await compiling;
        ready = true; api.render();
        warming = false; alloc(wantW, wantH);
      } catch (e) {
        failed = true;
        console.warn('section 4: the hall did not load; the stills stand in', e);
      }
    },
    resize(w, h) { wantW = Math.max(1, w); wantH = Math.max(1, h); if (!warming) alloc(wantW, wantH); },
    update(x, look, nearDoor, t, params) {
      curX = x; curNear = nearDoor;
      if (cam.fov !== params.fov) { cam.fov = params.fov; cam.updateProjectionMatrix(); }
      cam.position.set(x, params.eye, 0);
      const yaw = (look.yaw * Math.PI) / 180, pitch = (look.pitch * Math.PI) / 180;
      // looking west down the hall (-x); yaw turns toward -z on the right (facing -x, right is -z), pitch lifts the gaze
      _v.set(-Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.sin(yaw) * Math.cos(pitch)).add(cam.position);
      cam.lookAt(_v);
      // the prompt's camera keeps the keys' turn and the drag but not the pointer's sway, so the prompt stays on the door
      const ay = ((look.anchorYaw ?? 0) * Math.PI) / 180;
      anchorCam.copy(cam); anchorCam.lookAt(_v.set(x - Math.cos(ay), params.eye, -Math.sin(ay))); anchorCam.updateMatrixWorld();
      U.uExposure.value = params.exposure; U.uAlbedo.value = params.albedo; U.uSeams.value = params.seams; U.uGrain.value = params.grain; U.uGloss.value = params.gloss;
      // the seam of light brightens from 0.2 far out to the full glow at the station (spec section 4), in linear light, written as a display value
      if (seamMesh) seamMat.color.setScalar(Math.min(1, (0.2 + 0.8 * nearDoor) * params.seamGlow)).convertLinearToSRGB();
      void t;
    },
    swing(s, mode) {
      curSwing = s;
      for (const h of hinges) {
        h.group.visible = mode !== 2;
        // 0: the leaves swing inward (away from the visitor) about their jambs; 1: both slide aside as one slab
        h.group.rotation.y = mode === 1 ? 0 : h.sign * (SWING_DEG * Math.PI / 180) * s;
        h.group.position.z = h.z0 - (mode === 1 ? SLAB_SLIDE * s : 0);
      }
      if (seamMesh) seamMesh.visible = mode === 0 && s < 0.02;
    },
    render() {
      if (!rtScene || !ready && !started) return;
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
      renderer.toneMapping = NoToneMapping;
      renderer.setClearColor(clear, 1);
      if (!cubeDone && ready) {   // once: the hall seen from its centre, without its own reflection, for the floor's gloss
        cubeDone = true; U.uEnvOn.value = 0; const sv = seamMesh?.visible;
        for (const h of hinges) h.group.visible = true;
        cubeCam.update(renderer, scene); U.tEnv.value = cubeRT.texture; U.uEnvOn.value = 1;
        if (seamMesh && sv !== undefined) seamMesh.visible = sv;
      }
      renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(scene, cam);
      const P = (window.__skreedTune?.room?.params) ?? D;
      post.run(rtScene.texture, { boost: P.vignette, corners: P.corners, bleach: P.bleach, split: P.split, noise: o.reduced ? 0 : P.noise, bloom: o.touch ? 0 : P.bloom }, 0);
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
    },
    project(p) {
      _v.set(p[0], p[1], p[2]).project(anchorCam);
      if (_v.z > 1 || _v.z < -1) return null;
      const w = renderer.domElement.clientWidth || innerWidth, h = renderer.domElement.clientHeight || innerHeight;
      return { x: (_v.x * 0.5 + 0.5) * w, y: (-_v.y * 0.5 + 0.5) * h };
    },
    entering(on) { clear = on ? CLEAR_ENTERING : CLEAR; (scene.background as Color).copy(clear); },
    hooks() { return { started, ready, failed, x: +curX.toFixed(3), nearDoor: +curNear.toFixed(3), swing: +curSwing.toFixed(3), fov: cam.fov, size: [W, H], clear: clear === CLEAR ? 'white' : 'urban-slate' }; },
    dispose() {
      rtScene?.dispose(); rtScene = null; post.dispose();
      litMat.dispose(); fixtureMat.dispose(); spotMat.dispose(); leafMat.dispose(); seamMat.dispose();
      lightmap?.dispose();
      model?.traverse((obj) => { const m = obj as Mesh; if (m.isMesh) { m.geometry.dispose(); } });
      for (const h of hinges) { h.group.traverse((obj) => { const m = obj as Mesh; if (m.isMesh) m.geometry.dispose(); }); scene.remove(h.group); }
      cubeRT.dispose();
      if (model) scene.remove(model);
      model = null; ready = false;
    },
  };
  return api;
}
