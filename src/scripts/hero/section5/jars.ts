// Section 5's jar (docs/specs/section-5-sand.md 4, "The look and the maths"; section-5.md 3 "The glass", 5 "The island
// modules"): one glass jar over section 2's fog, drawn by the hero island where the section's slot is, filling with
// sand in the catalog's shades, a layer per follow in the order the follows come. Its own lazy chunk (the marker
// SIGNUP_MARK; scripts/hero/budget.mjs attributes it), import()ed by hero.ts at idle after section 4's cloud has warmed
// or when the section nears. jar.bin (scripts/signup/jar-bin.mjs, products.bin's layout) is read by section 4's
// loader-free parser. The settled sand is one small lathe of the jar's measured interior (jars-math.ts), clamped at the
// level in its vertex shader with a heap for a cap, speckled grain by grain by an integer hash over model-space cells
// that picks a shade of the layer's family from a palette texture built from the follow links' data-colours; the
// layers are two vec4 uniforms (the band tops and their owners). The pour is the only particle work and the only motion:
// one Points draw of seeds alone (no position attribute, so the draw range is set), every grain and mote a function of
// the uniforms, gl_VertexID and its seed, visible only while a stream runs. The glass is our own one-pass material as
// built (the gems' precedent, byte for byte): it refracts the frame behind it (the fog with the sand and the stream in
// it), a fresnel rim, one key highlight and a soft studio reflection. Two targets a frame: A, the fog quad with the sand
// and the stream; B, a copy of A under the glass. The slot's rect is cached (section4/layout.ts, the same triggers) and
// offset by scrollY each frame, so the jar scrolls with the page and sits where the CSS puts it, leaning JAR.tiltDeg
// towards the viewer. A press of a follow word (the 'skreed:signup' event) computes a stream's schedule once (the lead,
// the rise a quarter per 0.9 s, the tail); a press while the stream is emitting extends it, a later one is queued; at
// the total 'skreed:signup-poured' fires. The DOM's data-collected attributes are the follows' source of truth at the
// start; 'skreed:signup' events carry each press after that. Nothing moves at rest, and nothing answers the pointer.
import { BufferAttribute, BufferGeometry, Color, DataTexture, Float32BufferAttribute, FrontSide, Mesh, NearestFilter, NoToneMapping, OrthographicCamera, PerspectiveCamera, Points, RGBAFormat, Scene, ShaderMaterial, UnsignedByteType, Vector2, Vector3, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { JAR_BIN_URL, SIGNUP_FOLLOWS, jarById, yoursLevel, type SignupFrame, type SignupIsland, type SignupStill } from '../../../config/signup.ts';
import { PEARL_WHISPER, NIGHT } from '../../../config/tokens.ts';
import { fetchProductsBin } from '../section4/products-bin.ts';
import { watchLayout } from '../section4/layout.ts';
import { DUST, JAR, POUR, cells, extendPour, grainSeeds, layerTops, levelY, moundAt, placeJar, pourLevel, pourSchedule, profileR, restMound, sandBody, type Placement, type Schedule, type Slot } from './jars-math.ts';

export const SIGNUP_MARK = 'skreed:signup';

export interface JarsOptions {
  renderer: WebGLRenderer;
  /** section#signup */
  root: HTMLElement;
  reduced: boolean;
  /** the canvas's pixel ratio (DPR_CAP: touch 1.25, fine 1.5) */
  dpr: number;
  /** section 3's fog ground, this frame's (the quad behind the jar) */
  fog: () => Texture | null;
  /** every reading of the section's layout (the page scroll re-evaluates from here) */
  onLayout?(): void;
}

export interface JarsPlan { on: boolean; tex: Texture | null }

export interface JarsScene extends SignupIsland {
  readonly mark: string;
  readonly ready: boolean;
  readonly failed: boolean;
  /** the frame: draws when the section is in view or it is the fourth wipe's far side; the texture is the fog with the jar */
  step(f: { t: number; dt: number; wipe: number; cover: number }): JarsPlan;
  /** jar.bin, the geometry and the palette; the programs compiled one a frame */
  load(): Promise<void>;
  resize(w: number, h: number): void;
  /** document px: the exit seam's trigger (the body's bottom at the viewport's bottom) and the wrap's landing; NaN before a reading */
  exitY(): number;
  restY(): number;
  inView(): boolean;
  /** hooks builds only (folded out of the production chunk): the state */
  hooks?(): Record<string, unknown>;
  dispose(): void;
}

/** the palette's columns (a family's 24 shades twice, or Instagram's 48) and its rows (the follows) */
const COLS = 48, ROWS = SIGNUP_FOLLOWS.length;
/** display values in and out: the beads' gamma, a render parameter (a uniform, so the shaders carry no 2.2 of their own) */
const GAMMA = 2.2;
/** grains a second */
const RATE = POUR.streamPerQuarter / POUR.perQuarter;
/** a switch that does not exist, past any window */
const NEVER = 1e9;

const FS_VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
/** the fog quad (A's floor) and the copy (B's floor): the frame's bytes as written, or a flat colour for a still */
const COPY_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tMap; uniform vec2 uRes; uniform vec3 uFlat; uniform float uUseFlat;
void main() { vec3 c = texture2D(tMap, gl_FragCoord.xy / uRes).rgb; gl_FragColor = vec4(mix(c, uFlat, uUseFlat), 1.0); }`;
/**
 * The sand body (SAND_VERT, the uniforms' names short to keep the chunk under its line: uL the level, uF the fill's
 * floor and range, uR the inner radius, uC the interior's radius at the level, uK the cone's height, uD the dome's,
 * uP the cone's power): every vertex above the level collapses onto the level plane inside the interior's radius there
 * (the cap's clamp, so no sand shows through the foot); a cap vertex (normal +y) rises by the heap (the cone while a
 * stream lands, the dome at rest) with the heap's analytic normal. Every constant comes in as a uniform.
 */
const SAND_VERT = /* glsl */`uniform float uL,uR,uC,uK,uD,uP;uniform vec2 uF;varying vec3 vP;varying vec3 vN;
void main(){float yl=uF.x+uF.y*uL;vec3 p=position,n=normal;float r=length(p.xz);bool c=n.y>0.5;
if(c||p.y>yl){float s=r>0.0?min(1.0,uC/r):1.0;p.xz*=s;r*=s;p.y=yl;}
if(c){float a=min(1.0,r/max(uC,1e-4)),b=1.0-a,q=1.0-a*a;p.y+=uK*pow(b,uP)+uD*q*q;float d=(uK*uP*pow(max(b,1e-4),uP-1.0)+4.0*uD*q*a)/max(uC,1e-4);vec2 e=r>0.0?p.xz/r:vec2(0.0);n=normalize(vec3(d*e.x,1.0,d*e.y));}
vec4 m=modelViewMatrix*vec4(p,1.0);vP=p;vN=normalize(normalMatrix*n);gl_Position=projectionMatrix*m;}`;
/**
 * The sand's surface (SAND_FRAG; tP the palette, uN its columns, uY the gamma, uI the key, uA the ambient, uW the
 * light's colour, uG the cells a jar height, uE the layer boundary's dither, uJ the per-grain normal tilt, uO the
 * resting dome's height, uB the four band tops and uV their owners): an integer hash over model-space cells (2.2 device
 * px each) picks a shade column and a dither; the fragment's height against the band tops (following the resting dome,
 * dithered by one grain) picks the layer's owner, its palette row; the normal tilts a little per grain; matte under the
 * key and the ambient.
 */
const SAND_FRAG = /* glsl */`precision highp float;uniform sampler2D tP;uniform vec2 uF;uniform vec4 uB,uV;uniform vec3 uI,uA,uW;uniform float uG,uR,uE,uJ,uO,uN,uY;varying vec3 vP;varying vec3 vN;
uint hash(uvec3 c){uint h=c.x*0x8da6b343u^c.y*0xd8163841u^c.z*0xcb1ab31fu;h^=h>>15u;h*=0x2c1b3c6du;return h^(h>>12u);}
void main(){uint h=hash(uvec3(ivec3(floor(vP*uG+512.0))));float r1=float(h&0xffffu)/65535.0,r2=float(h>>16u)/65535.0;
float rr=length(vP.xz)/uR,q=1.0-min(1.0,rr*rr),hf=(vP.y-uF.x-uO*q*q)/uF.y+(r1-0.5)*uE;
float o=hf<uB.x?uV.x:hf<uB.y?uV.y:hf<uB.z?uV.z:uV.w;
vec3 b=pow(texelFetch(tP,ivec2(min(int(r2*uN),int(uN)-1),int(o+0.5)),0).rgb,vec3(uY));
vec3 n=normalize(normalize(vN)+(vec3(r1,r2,fract(r1*7.31))-0.5)*uJ);
vec3 l=b*(uA+uW*max(dot(n,uI),0.0)*0.85);gl_FragColor=vec4(pow(max(l,0.0),vec3(1.0/uY)),1.0);}`;
/**
 * The pour (POUR_VERT; uT the stream's clock, uM the windows (the emission's end, the landing's end, the first lead,
 * the total), uQ the rates (grains and motes a second), uH the fall (g, v0, the source's height, the stream's radius),
 * uS the grain (its radius, the sink, the spread, the slide), uX the point sizes (the grains' clamp, the motes' base
 * and spread in device px), uDa to uDd the dust's shape and life (jars-math.ts DUST, with the stream's fade-in), uU the
 * owner switches and uZ the presses' palette rows, u0 the split (the motes come first in the buffer, the grains after),
 * u1 the model's height in device px, u2 the pixel ratio, u3 the motes' peak alpha): each vertex a function of the
 * clock, its index and its seed. A grain is emitted on a fixed grid (its index over the rate plus a jitter) while its
 * time is under the window's end, falls from the source, lands on the surface under it (the level and the heap), slides
 * outward and sinks; a mote is born at the landing on its own grid while the landing window is open, puffs up with
 * drag, drifts out and settles, inside the jar. Whatever is off writes a clip-space point outside the volume with size
 * 0 and assigns every varying on that path too (ANGLE's uninitialised-variable warning).
 */
const POUR_VERT = /* glsl */`attribute vec4 aSeed;uniform float uT,uL,uC,uK,uD,uP,u1,u2,u0,uN,u3;uniform vec2 uF,uQ;uniform vec3 uU,uZ;uniform vec4 uM,uH,uS,uX,uDa,uDb,uDc,uDd;varying float vS;varying float vA;varying float vO;
float surf(float r){float a=min(1.0,r/max(uC,1e-4)),q=1.0-a*a;return uF.x+uF.y*uL+uK*pow(1.0-a,uP)+uD*q*q;}
void main(){vec4 r=aSeed;float id=float(gl_VertexID),TAU=6.2831853;bool on=false;vec3 p=vec3(0.0);float al=0.0,sz=0.0,te=0.0;
if(id>=u0){te=(id-u0+r.x)/uQ.x;float a=uT-te;
if(te<uM.x&&a>0.0){float th=r.y*TAU,rs=uH.w*(0.3+0.7*r.z*r.z);vec2 xz=vec2(cos(th),sin(th))*(rs+(r.w-0.5)*uS.z*a);
float y=uH.z-uH.y*a-0.5*uH.x*a*a,ys=surf(length(xz)),d=ys-y;
if(d<=uS.y){on=true;if(d>0.0){xz*=1.0+uS.w*d/uS.y;y=ys+uS.x;al=1.0-smoothstep(0.5,1.0,d/uS.y);}else al=smoothstep(0.0,uDd.w,uH.z-y);p=vec3(xz.x,y,xz.y);sz=clamp(2.0*uS.x*u1,uX.x,uX.y);}}}
else{float tb=uM.z+(id+r.x)/uQ.y,a=uT-tb,life=min(uDd.x+uDd.y*r.y,uM.w-tb);te=tb-uM.z;
if(tb<uM.y&&a>0.0&&a<life){on=true;float u=a/max(life,1e-4),e=(1.0-exp(-uDd.z*a))/uDd.z,th=r.z*TAU;
float rad=min(uDc.x,uDa.x+uDa.y*r.w+(uDa.z+uDa.w*r.y)*e),y=min(uDc.y,surf(rad)+(uDb.x+uDb.y*r.w)*e-uDb.z*max(0.0,a-uDb.w));
p=vec3(cos(th)*rad,y,sin(th)*rad);al=smoothstep(0.0,uDc.z,u)*(1.0-smoothstep(uDc.w,1.0,u))*u3;sz=(uX.z+uX.w*r.x)*u2;}}
if(on){vS=floor(fract(r.x*9.0+r.y*17.0)*uN);vA=al;vO=te<uU.x?uZ.x:te<uU.y?uZ.y:uZ.z;vec4 m=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*m;gl_PointSize=sz;}
else{gl_Position=vec4(2.0,2.0,2.0,1.0);gl_PointSize=0.0;vS=0.0;vA=0.0;vO=0.0;}}`;
/** a grain or a mote (POUR_FRAG): its shade from the palette, lit flat, with its alpha */
const POUR_FRAG = /* glsl */`precision highp float;uniform sampler2D tP;uniform vec3 uA,uW;uniform float uY;varying float vS;varying float vA;varying float vO;
void main(){if(vA<=0.0)discard;vec3 c=pow(texelFetch(tP,ivec2(int(vS),int(vO+0.5)),0).rgb,vec3(uY))*(uA+0.5*uW);gl_FragColor=vec4(pow(c,vec3(1.0/uY)),vA);}`;
const GLASS_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const GLASS_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tFrame; uniform vec2 uRes, uRefract; uniform vec3 uKey, uLightCol, uDark, uTint;
varying vec3 vN; varying vec3 vV;
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 off = -n.xy * uRefract * (1.0 - ndv * 0.6);
  vec3 back = texture2D(tFrame, clamp(uv + off, vec2(0.001), vec2(0.999))).rgb * uTint;
  vec3 r = reflect(-v, n); float sky = smoothstep(-0.25, 0.9, r.y);
  vec3 refl = mix(uDark, uLightCol, sky);
  vec3 h = normalize(uKey + v); float spec = pow(max(dot(n, h), 0.0), 180.0);
  vec3 col = mix(back, refl, F * 0.85) + uLightCol * spec * 0.9 + uLightCol * F * 0.12;
  gl_FragColor = vec4(min(col, 1.0), 1.0);
}`;

const hex3 = (hex: string): Vector3 => { const c = new Color(hex); return new Vector3(c.r, c.g, c.b); };

/** one stream: the presses it carries, the wall clock at its start (the loop's seconds), its schedule and the hooks' clock */
interface Stream { ids: string[]; t0: number; sched: Schedule; scrub: number | null }

export function createJars(o: JarsOptions): JarsScene {
  const { renderer, root, reduced } = o;
  const H = document.documentElement;
  const body = root.querySelector<HTMLElement>('.su-body');
  const slotEl = root.querySelector<HTMLElement>('.su-slot[data-slot="yours"]');
  // each platform's sand colours, the family's catalog hexes joined at build into its follow link's markup (Signup.astro),
  // so the shade table never ships in this chunk
  const links = [...root.querySelectorAll<HTMLElement>('a.su-follow[data-id]')];
  const hexesOf = (id: string): string[] => (links.find((a) => a.dataset.id === id)?.dataset.colours ?? '').split(',').filter((h) => /^#[0-9a-f]{6}$/i.test(h));
  let disposed = false, ready = false, failed = false, W = 8, H8 = 8, cssW = 8, cssH = 8, lastT = 0, warmed = false, tiltDeg: number = JAR.tiltDeg;
  const dpr = o.dpr;
  const ac = new AbortController();

  // ---- the layout, cached: the section's top and height, the body's bottom and the slot's document rect
  let top = NaN, height = 1, bodyBottom = NaN, slotRect: Slot | null = null;
  const lay = watchLayout({
    html: H,
    read: () => {
      if (!root.getClientRects().length) return null;
      const r = root.getBoundingClientRect(), b = (body ?? root).getBoundingClientRect();
      bodyBottom = b.bottom + scrollY;
      if (slotEl) { const s = slotEl.getBoundingClientRect(); slotRect = { x: s.left, y: s.top + scrollY, w: s.width, h: s.height }; }
      return { top: r.top + scrollY, height: r.height };
    },
    watch: [root, body, document.getElementById('find'), document.getElementById('room'), H],
    onMeasure: (l) => { top = l.top; height = l.height; o.onLayout?.(); },
  });
  const current = () => { if (!Number.isFinite(top)) lay.measure(); else lay.get(); };

  // ---- the stage: a fixed camera, the fog quad, the sand body, the pour's points, the glass; two targets
  const cam = new PerspectiveCamera(JAR.fovDeg, 1, 0.1, 100);
  cam.position.set(0, 0, JAR.distance); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const fsGeo = new BufferGeometry(); fsGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const copyU = { tMap: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uFlat: { value: hex3(NIGHT) }, uUseFlat: { value: 0 } };
  const copyMat = new ShaderMaterial({ uniforms: copyU, vertexShader: FS_VERT, fragmentShader: COPY_FRAG, depthTest: false, depthWrite: false });
  const copyMesh = new Mesh(fsGeo, copyMat); copyMesh.frustumCulled = false;
  const copyScene = new Scene(); copyScene.add(copyMesh);
  const keyDir = new Vector3(0.3, 0.8, 0.55).normalize();
  // the palette: 48 x 3 RGBA8, a row per follow (a family's 24 shades twice, Instagram's 48), the texels sRGB bytes
  const palette = new DataTexture(new Uint8Array(COLS * ROWS * 4), COLS, ROWS, RGBAFormat, UnsignedByteType);
  palette.magFilter = palette.minFilter = NearestFilter; palette.generateMipmaps = false;
  // the uniforms the body and the pour share (one object each, so a write reaches both programs)
  const shared = {
    uL: { value: 0 }, uF: { value: new Vector2(levelY(0), JAR.shoulder - JAR.floor) }, uR: { value: JAR.innerR }, uC: { value: profileR(levelY(0)) },
    uK: { value: 0 }, uD: { value: 0 }, uP: { value: POUR.conePow },
    tP: { value: palette }, uN: { value: COLS }, uY: { value: GAMMA },
    uI: { value: keyDir }, uA: { value: new Vector3(0.42, 0.43, 0.47) }, uW: { value: hex3(PEARL_WHISPER) },
  };
  const sandU = { ...shared, uG: { value: 140 }, uE: { value: POUR.edge }, uJ: { value: POUR.tilt }, uO: { value: POUR.moundRest }, uB: { value: new Float32Array([1, 1, 1, 1]) }, uV: { value: new Float32Array(4) } };
  const pourU = {
    ...shared, uT: { value: 0 }, uM: { value: new Float32Array(4) }, uQ: { value: new Vector2(RATE, POUR.dustRate) },
    uH: { value: new Float32Array([POUR.g, POUR.v0, POUR.srcY, POUR.streamR]) }, uS: { value: new Float32Array([POUR.grainR, POUR.sink, POUR.spread, POUR.slide]) },
    uX: { value: new Float32Array([POUR.grainPx[0], POUR.grainPx[1], POUR.dustPx[0], POUR.dustPx[1]]) },
    uDa: { value: Float32Array.from(DUST.radial) }, uDb: { value: Float32Array.from(DUST.rise) }, uDc: { value: new Float32Array([DUST.rMax, DUST.yMax, DUST.fadeIn, DUST.fadeOut]) }, uDd: { value: new Float32Array([DUST.life[0], DUST.life[1], DUST.drag, POUR.fadeIn]) },
    uU: { value: new Float32Array([NEVER, NEVER, NEVER]) }, uZ: { value: new Float32Array(3) }, u0: { value: POUR.dust },
    u1: { value: 1 }, u2: { value: dpr }, u3: { value: POUR.dustAlpha },
  };
  const glassShared = { tFrame: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uKey: { value: keyDir }, uLightCol: { value: hex3(PEARL_WHISPER) }, uDark: { value: new Vector3(0.22, 0.24, 0.3) }, uTint: { value: new Vector3(0.96, 0.98, 1.0) } };
  const sceneA = new Scene(), sceneB = new Scene();
  const fogQuad = new Mesh(fsGeo, copyMat); fogQuad.frustumCulled = false; fogQuad.renderOrder = -10; sceneA.add(fogQuad);
  const copyB = new Mesh(fsGeo, copyMat); copyB.frustumCulled = false; copyB.renderOrder = -10; sceneB.add(copyB);
  let rtA = new WebGLRenderTarget(8, 8, { depthBuffer: true }), rtB = new WebGLRenderTarget(8, 8, { depthBuffer: true });
  // the body: the lathe, one draw, hidden at level 0
  const sb = sandBody(), bodyGeo = new BufferGeometry();
  bodyGeo.setAttribute('position', new Float32BufferAttribute(sb.position, 3)); bodyGeo.setAttribute('normal', new Float32BufferAttribute(sb.normal, 3)); bodyGeo.setIndex(new BufferAttribute(sb.index, 1));
  const sandMat = new ShaderMaterial({ uniforms: sandU, vertexShader: SAND_VERT, fragmentShader: SAND_FRAG });
  const sand = new Mesh(bodyGeo, sandMat); sand.frustumCulled = false; sand.visible = false; sceneA.add(sand);
  // the pour: seeds alone (the motes first, then the grains), drawn to a set range, after the body, no depth written
  const pourGeo = new BufferGeometry();
  pourGeo.setAttribute('aSeed', new BufferAttribute(grainSeeds(POUR.dust + POUR.stream, POUR.seed), 4, true));
  pourGeo.setDrawRange(0, 0);
  const pourMat = new ShaderMaterial({ uniforms: pourU, vertexShader: POUR_VERT, fragmentShader: POUR_FRAG, transparent: true, depthTest: true, depthWrite: false });
  const points = new Points(pourGeo, pourMat); points.frustumCulled = false; points.visible = false; points.renderOrder = 1; sceneA.add(points);
  // the glass: jar.bin's geometry once it is in
  const glassMat = new ShaderMaterial({ uniforms: { ...glassShared, uRefract: { value: new Vector2(0, 0) } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, side: FrontSide });
  const glass = new Mesh(new BufferGeometry(), glassMat); glass.frustumCulled = false; glass.visible = false; sceneB.add(glass);
  let jarGeo: BufferGeometry | null = null;
  const _cc = new Color();

  // ---- the state: the follows in press order, the level, the running stream and the queue
  const domFollows = (): string[] => [...root.querySelectorAll<HTMLElement>('li.su-follow-row[data-collected]')].sort((a, b) => Number(a.dataset.collected) - Number(b.dataset.collected)).map((li) => li.dataset.id ?? '').filter(Boolean);
  let order: string[] = domFollows(), level = 0, stream: Stream | null = null, placement: Placement | null = null, slot: Slot | null = null;
  const queue: string[] = [];
  const ownerOf = (id: string): number => Math.max(0, SIGNUP_FOLLOWS.findIndex((f) => f.id === id));
  const setLevel = (v: number) => { level = v; shared.uL.value = v; shared.uC.value = profileR(levelY(v)); };
  const setMound = (m: { cone: number; dome: number }) => { shared.uK.value = m.cone; shared.uD.value = m.dome; };
  const setLayers = (ids: readonly string[]) => { const { bands, owners } = layerTops(ids); sandU.uB.value.set(bands); sandU.uV.value.set(owners); };
  const clock = (s: Stream): number => s.scrub ?? lastT - s.t0;
  const grains = (sc: Schedule): number => Math.min(POUR.stream, Math.ceil(sc.emit * RATE));
  const motes = (sc: Schedule): number => Math.min(POUR.dust, Math.ceil((sc.landEnd - sc.lead0) * POUR.dustRate));
  const poured = (id: string) => dispatchEvent(new CustomEvent('skreed:signup-poured', { detail: { id, level: +level.toFixed(3) } }));
  /** the uniforms a schedule sets: the windows, the switches and the owners, the draw range */
  function applyStream(s: Stream) {
    const sc = s.sched, ow = sc.owners;
    pourU.uM.value.set([sc.emit, sc.landEnd, sc.lead0, sc.total]);
    pourU.uU.value.set([sc.switches[0] ?? NEVER, sc.switches[1] ?? NEVER, NEVER]);
    pourU.uZ.value.set([ow[0] ?? 0, ow[1] ?? ow[0] ?? 0, ow[2] ?? ow[1] ?? ow[0] ?? 0]);
    pourGeo.setDrawRange(0, POUR.dust + grains(sc));
  }
  function startStream(id: string) {
    const j = jarById(id);
    if (!j) return;
    stream = { ids: [id], t0: lastT, sched: pourSchedule(j.worth, level, ownerOf(id)), scrub: null };
    applyStream(stream);
  }
  function finish(s: Stream) {
    stream = null; pourGeo.setDrawRange(0, 0);
    setLevel(s.sched.to); setMound(restMound(level));
    poured(s.ids[s.ids.length - 1]);
    const next = queue.shift();
    if (next) startStream(next);
  }
  /** the stream's clock this frame: the level and the heap by the schedule; the end at the total */
  function advance() {
    const s = stream;
    if (!s) return;
    const t = clock(s);
    if (t >= s.sched.total) { finish(s); return; }
    setLevel(pourLevel(s.sched, t, false)); setMound(moundAt(t, s.sched)); pourU.uT.value = t;
  }
  /** a press: a stream from a standstill, the running stream extended while it emits, or the press queued */
  function press(id: string) {
    const j = jarById(id);
    if (!j) return;
    if (reduced) { setLevel(yoursLevel(order)); setMound(restMound(level)); poured(id); return; }
    if (!stream) { startStream(id); return; }
    const ext = extendPour(stream.sched, j.worth, ownerOf(id), clock(stream));
    if (ext) { stream.sched = ext; stream.ids.push(id); applyStream(stream); } else queue.push(id);
  }
  /** the follows as they stand: the jar set at its level, layered, no stream */
  function setAtOnce(ids: readonly string[]) {
    order = ids.filter((id) => jarById(id)); setLayers(order);
    stream = null; queue.length = 0; pourGeo.setDrawRange(0, 0);
    setLevel(yoursLevel(order)); setMound(restMound(level));
  }
  function onSignup(e: Event) {
    const d = (e as CustomEvent<{ id: string; follows: string[] }>).detail;
    if (!d) return;
    const ids = d.follows.filter((id) => jarById(id));
    // no id: the follows as saved (the DOM script's mount after a reload within the visit): the jar set at once
    if (!d.id) { setAtOnce(ids); return; }
    const fresh = !!jarById(d.id) && !order.includes(d.id);
    order = ids; setLayers(order);
    if (fresh) press(d.id);
  }
  addEventListener('skreed:signup', onSignup);

  // ---- rendering
  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
  const compile = async (sc: Scene, c: PerspectiveCamera | OrthographicCamera, target: WebGLRenderTarget) => {
    const tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(target);
    const done = renderer.compileAsync(sc, c, sc);
    renderer.setRenderTarget(null); renderer.toneMapping = tm;
    await done;
  };
  const pose = (m: Mesh | Points, p: Placement) => { m.position.set(p.x, p.y, 0); m.scale.setScalar(p.scale); m.rotation.x = (tiltDeg * Math.PI) / 180; m.updateMatrixWorld(); };
  const show = (v: boolean) => { sand.visible = v && level > 0; points.visible = v && !!stream; glass.visible = v; };
  /** the jar placed from its slot this frame; a slot off screen by more than its height is skipped */
  function place(view: { w: number; h: number }, sy: number) {
    const r = slotRect;
    if (!r) { placement = null; show(false); return; }
    const s: Slot = { x: r.x, y: r.y - sy, w: r.w, h: r.h };
    const vis = s.y + s.h > -s.h && s.y < view.h + s.h;
    show(vis);
    if (!vis) return;
    const p = placeJar(s, view, tiltDeg);
    placement = p; slot = s;
    pose(sand, p); pose(points, p); pose(glass, p);
    glassMat.uniforms.uRefract.value.set((JAR.refract * p.px) / Math.max(1, view.w), (JAR.refract * p.px) / Math.max(1, view.h));
    sandU.uG.value = cells(p.px, dpr); pourU.u1.value = p.px * dpr;
  }
  function draw(fog: Texture | null, flat: boolean, target: WebGLRenderTarget, mid: WebGLRenderTarget, c: PerspectiveCamera) {
    const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping; renderer.setClearColor(0x000000, 1);
    copyU.uRes.value.set(mid.width, mid.height); copyU.tMap.value = fog; copyU.uUseFlat.value = flat || !fog ? 1 : 0;
    renderer.setRenderTarget(mid); renderer.clear(); renderer.render(sceneA, c);
    copyU.tMap.value = mid.texture; copyU.uUseFlat.value = 0; glassShared.tFrame.value = mid.texture; glassShared.uRes.value.set(target.width, target.height);
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(sceneB, c);
    renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
  }

  const inView = () => { current(); if (!Number.isFinite(top)) return false; const rTop = top - scrollY; return rTop < innerHeight && rTop + height > 0; };

  const api: JarsScene = {
    mark: SIGNUP_MARK,
    get ready() { return ready; },
    get failed() { return failed; },
    step(f) {
      lastT = f.t;
      advance();
      const on = ready && !disposed && (f.wipe > 0 || inView());
      window.__skreedSignupFrame?.({ on, cover: f.cover, wipe: f.wipe, pour: stream ? stream.ids[stream.ids.length - 1] : null } satisfies SignupFrame);
      if (!on) return { on: false, tex: null };
      current();
      const sy = scrollY;
      cam.aspect = cssW / Math.max(1, cssH); cam.updateProjectionMatrix();
      place({ w: cssW, h: cssH }, sy);
      draw(o.fog(), false, rtB, rtA, cam);
      return { on: true, tex: rtB.texture };
    },
    async load() {
      if (ready || failed || disposed) return;
      try {
        const [p] = await fetchProductsBin(JAR_BIN_URL, ac.signal);
        if (disposed) return;
        if (!p || !p.parts.length) throw new Error('jar.bin: no jar');
        jarGeo = p.parts[0].geometry; glass.geometry = jarGeo;
        // the palette from the links' hexes, a row per follow in SIGNUP_FOLLOWS order
        const data = palette.image.data as Uint8Array;
        SIGNUP_FOLLOWS.forEach((f, row) => {
          const list = hexesOf(f.id);
          for (let k = 0; k < COLS; k++) {
            const hex = list.length ? list[k % list.length] : NIGHT, at = (row * COLS + k) * 4;
            data[at] = parseInt(hex.slice(1, 3), 16); data[at + 1] = parseInt(hex.slice(3, 5), 16); data[at + 2] = parseInt(hex.slice(5, 7), 16); data[at + 3] = 255;
          }
        });
        palette.needsUpdate = true;
        order = domFollows();   // the DOM as it stands now: the DOM script may have marked the saved follows since this chunk was made
        if (!stream) setAtOnce(order); else setLayers(order);
        // the programs, one a frame, with a target bound (three keys each program on the target); the points visible with a range of 0, so the pour's program is warm before the first press
        if (!warmed) {
          warmed = true;
          sand.visible = true; points.visible = true; glass.visible = true;
          await compile(copyScene, fsCam, rtA); await frame(); if (disposed) return;
          await compile(sceneA, cam, rtA); await frame(); if (disposed) return;
          await compile(sceneB, cam, rtB); await frame(); if (disposed) return;
          show(false);
        }
        ready = true;
      } catch (e) {
        if (disposed) return;
        failed = true;
        console.warn('section 5: jar.bin did not load; the section stands as text', e);
        root.dataset.tier = 'poster';
      }
    },
    resize(w, h) {
      W = Math.max(1, w); H8 = Math.max(1, h); cssW = W / dpr; cssH = H8 / dpr;
      rtA.setSize(W, H8); rtB.setSize(W, H8);
      lay.measure();
    },
    exitY() { current(); return Number.isFinite(bodyBottom) ? bodyBottom - innerHeight : NaN; },
    restY() { current(); const e = api.exitY(); return Number.isFinite(e) ? Math.max(top, e) : NaN; },
    inView,
    pour(id) { onSignup(new CustomEvent('skreed:signup', { detail: { id, follows: order.includes(id) ? order : [...order, id] } })); },
    follows(ids) { setAtOnce(ids); },
    dispose() {
      disposed = true; ac.abort();
      removeEventListener('skreed:signup', onSignup);
      lay.dispose();
      rtA.dispose(); rtB.dispose(); copyMat.dispose(); fsGeo.dispose(); bodyGeo.dispose(); pourGeo.dispose(); palette.dispose(); sandMat.dispose(); pourMat.dispose(); glassMat.dispose(); jarGeo?.dispose();
      if (window.__skreedSignup === api) window.__skreedSignup = undefined;
    },
  };
  // the hooks (section-5-sand.md 5, "Hooks"; D12): one block the production build drops, as loop.ts and director.ts fold theirs
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    /** the jar at the layers of an order over --night, 320 x 400, the resting dome, the tilt, no points; the pixels bottom-up */
    api.still = async (ids, lv): Promise<SignupStill | null> => {
      if (!ready || disposed) return null;
      const w = 320, h = 400, c = new PerspectiveCamera(JAR.fovDeg, w / h, 0.1, 100);
      c.position.set(0, 0, JAR.distance); c.lookAt(0, 0, 0); c.updateMatrixWorld(); c.updateProjectionMatrix();
      const mid = new WebGLRenderTarget(w, h, { depthBuffer: true }), out = new WebGLRenderTarget(w, h, { depthBuffer: true });
      const was = { level, cone: shared.uK.value, dome: shared.uD.value, g: sandU.uG.value };
      try {
        const list = ids.filter((id) => jarById(id)), L = lv ?? yoursLevel(list);
        setLayers(list); setLevel(L); setMound(restMound(L));
        const p = placeJar({ x: 0, y: 0, w, h }, { w, h }, tiltDeg);
        pose(sand, p); pose(glass, p);
        glassMat.uniforms.uRefract.value.set((JAR.refract * p.px) / w, (JAR.refract * p.px) / h);
        sandU.uG.value = cells(p.px, 1);
        sand.visible = L > 0; points.visible = false; glass.visible = true;
        draw(null, true, out, mid, c);
        const data = new Uint8Array(w * h * 4);
        renderer.readRenderTargetPixels(out, 0, 0, w, h, data);
        return { width: w, height: h, data };
      } finally {
        setLayers(order); setLevel(was.level); shared.uK.value = was.cone; shared.uD.value = was.dome; sandU.uG.value = was.g;
        mid.dispose(); out.dispose();
      }
    };
    /** while a number, the running stream reads it as its clock every frame; null lets the wall clock run on from it */
    api.scrub = (t) => {
      const s = stream;
      if (!s) return;
      if (t === null) { if (s.scrub !== null) { s.t0 = lastT - s.scrub; s.scrub = null; } } else s.scrub = t;
    };
    api.tilt = (deg) => { tiltDeg = deg; };
    api.hooks = () => {
      const s = stream, sc = s?.sched, t = s ? clock(s) : 0, lt = layerTops(order);
      return {
        ready, failed, order: [...order], level: +level.toFixed(3), target: yoursLevel(order),
        pour: s && sc ? { id: s.ids[s.ids.length - 1], ids: [...s.ids], t, phase: t < sc.lead ? 'lead' : t < sc.landEnd ? 'pour' : 'tail', lead: sc.lead, pour: sc.pour, emit: sc.emit, total: sc.total, switches: [...sc.switches], owners: [...sc.owners], grains: grains(sc), dust: motes(sc) } : null,
        queue: [...queue],
        layers: order.map((id, k) => ({ id, from: k ? lt.bands[k - 1] : 0, to: lt.bands[k] })),
        mound: { cone: shared.uK.value, dome: shared.uD.value },
        bands: [...sandU.uB.value], owners: [...sandU.uV.value],
        layout: lay.layout ? { ...lay.layout, bodyBottom } : null,
        slot: slot ? { ...slot } : null, placed: placement ? { ...placement, box: { ...placement.box } } : null,
      };
    };
  }
  window.__skreedSignup = api;
  return api;
}
