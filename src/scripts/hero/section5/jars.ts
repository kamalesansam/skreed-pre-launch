// Section 5's jar (docs/specs/section-5-liquid.md 4, "The look and the maths"; section-5.md 3 "The glass", 5 "The
// island modules"): one glass jar over section 2's fog, drawn by the hero island where the section's slot is, filling
// with a translucent liquid in the catalog's shades, a band per quarter of worth in the order the follows come. Its own
// lazy chunk (the marker SIGNUP_MARK; scripts/hero/budget.mjs attributes it), import()ed by hero.ts at idle after
// section 4's cloud has warmed or when the section nears. jar.bin (scripts/signup/jar-bin.mjs, products.bin's layout)
// is read by section 4's loader-free parser. The settled liquid is one small lathe of the jar's measured interior
// (jars-math.ts), clamped at the level in its vertex shader so its cap is the surface, drawn opaque and composing the
// fog itself: the fog sampled behind each fragment, dyed by the band's shade to the power of the view's chord through
// the liquid (the jar's width reproduces the shade, the rims thin to the fog), plus a scatter that gives it a body over
// --night; the bands are four tops and four colours in uniforms with a soft seam; the cap carries the glass's own
// studio reflection, one highlight, a sheen and a meniscus, and, while a stream lands, the dimple under the foot and
// the rings running out from it as a tilt of its normal. The pour is one tube of 128 vertices formed from two span
// uniforms every frame, tapered by mass conservation, its colour switching parcel by parcel down its length, blended
// over the body with no depth written (the body's depth hides its foot). The glass is our own one-pass material as
// built (the gems' precedent, byte for byte): it refracts the frame behind it (the fog with the liquid and the stream),
// a fresnel rim, one key highlight and a soft studio reflection. Two targets a frame: A, the fog quad with the body and
// the stream; B, a copy of A under the glass. The slot's rect is cached (section4/layout.ts, the same triggers, with the
// slot, its block and the body's blocks watched too, and read afresh on resize, stage/resize.ts) and offset by scrollY
// each frame, so the jar scrolls with the page and sits where the CSS puts it, seen from JAR.tiltDeg above. A press of
// a follow word (the 'skreed:signup' event) computes a stream's schedule once (the lead, the rise a quarter per 0.9 s,
// the tail, a switch of shade per quarter); a press while the stream is emitting extends it, a later one is queued; at
// the total 'skreed:signup-poured' fires. The DOM's data-collected attributes are the follows' source of truth at the
// start; 'skreed:signup' events carry each press after that. Nothing moves at rest (the ripple's weight is exactly 0
// and no clock is read), and nothing answers the pointer.
import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute, FrontSide, Mesh, NoToneMapping, OrthographicCamera, PerspectiveCamera, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { JAR_BIN_URL, SIGNUP_FOLLOWS, WORTH_TOTAL, jarById, yoursLevel, type SignupFrame, type SignupIsland, type SignupStill } from '../../../config/signup.ts';
import { PEARL_WHISPER, NIGHT } from '../../../config/tokens.ts';
import { fetchProductsBin } from '../section4/products-bin.ts';
import { watchLayout } from '../section4/layout.ts';
import { GAMMA, JAR, LIQ, dimpleWeight, extendPour, layerBands, levelY, linearOf, liquidBody, placeJar, pourLevel, pourSchedule, profileR, rippleWeight, streamSpan, tubeGeometry, type Placement, type Schedule, type Slot } from './jars-math.ts';

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
  /** jar.bin, the geometry and the colours; the programs compiled one a frame */
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

/** a switch that does not exist, past any window */
const NEVER = 1e9;
/** the rings' wave number: 2 pi over their wavelength */
const K = (2 * Math.PI) / LIQ.rippleLen;

const FS_VERT = /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
/** the fog quad (A's floor) and the copy (B's floor): the frame's bytes as written, or a flat colour for a still */
const COPY_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tMap; uniform vec2 uRes; uniform vec3 uFlat; uniform float uUseFlat;
void main() { vec3 c = texture2D(tMap, gl_FragCoord.xy / uRes).rgb; gl_FragColor = vec4(mix(c, uFlat, uUseFlat), 1.0); }`;
/**
 * The body (LIQ_VERT; the uniforms' names short to keep the chunk under its line: uL the level, uF the fill's floor and
 * range, uC the interior's radius at the level): every vertex above the level, and every cap vertex (normal +y),
 * collapses onto the level plane inside the interior's radius there, so the cap is a level disc in the jar's frame and
 * nothing shows through the foot. Varyings: the jar-frame position, the view normal and view vector, 1 on the cap.
 */
const LIQ_VERT = /* glsl */`uniform float uL,uC;uniform vec2 uF;varying vec3 vP;varying vec3 vN;varying vec3 vV;varying float vC;
void main(){float yl=uF.x+uF.y*uL,c=step(0.5,normal.y);vec3 p=position;
if(c>0.0||p.y>yl){float r=length(p.xz);p.xz*=r>0.0?min(1.0,uC/r):1.0;p.y=yl;}
vec4 m=modelViewMatrix*vec4(p,1.0);vP=p;vN=normalize(normalMatrix*normal);vV=-m.xyz;vC=c;gl_Position=projectionMatrix*m;}`;
/**
 * The dye (LIQ_FRAG): the fog behind the fragment (tMap, uRes, uFlat, uUseFlat: the copy material's own objects, so a
 * still over --night gets the night) decoded by the gamma uY, times the band's colour (uK0 to uK3 by the tops uB with
 * the seam uE) to the power of the chord over uD0 (on the wall twice the radius times the view cosine; on the cap the
 * liquid's height over the refracted cosine through uEta, at most uD0), plus the scatter uSc under the light uW. On
 * the cap the normal is tilted by the rings (uRp: slope, wave number, angular speed, decay; the weight uRw; the clock
 * uT), the dimple (uDm: slope, radius, rim; the weight uDw) and the meniscus (uMn: width, tilt) against the view's
 * tilt uTc; then the studio reflection (uDark to uW by the reflected ray's height over uSk) is mixed in by the fresnel
 * uFr at uRl, the highlight from the key uI (uSp: power, weight) and the sheen uSn added. The liquid's own refraction
 * bends the fog it samples by the normal (uRf: the offset at the silhouette as a share of the frame, set from the
 * placement as the glass's is, and its fall-off towards the face-on view). Out through the gamma, alpha 1.
 */
const LIQ_FRAG = /* glsl */`precision highp float;uniform sampler2D tMap;uniform vec2 uRes,uF,uTc,uSk,uSp,uMn;uniform vec3 uFlat,uK0,uK1,uK2,uK3,uW,uI,uDark,uFr,uDm,uRf;uniform vec4 uB,uRp;
uniform float uUseFlat,uL,uC,uY,uD0,uEta,uSc,uE,uRl,uSn,uRw,uDw,uT;varying vec3 vP;varying vec3 vN;varying vec3 vV;varying float vC;
void main(){vec3 v=normalize(vV),n;vec2 e=vP.xz;float rho=length(e);e/=max(rho,1e-4);
if(vC>0.5){float u=rho/uDm.y,g=uRw*uRp.x*sin(uRp.y*rho-uRp.z*uT)*exp(-uRp.w*rho)+uDw*uDm.x*u*exp(-u*u)*(1.0+uDm.z-uDm.z*u*u)+(1.0-smoothstep(0.0,uMn.x,uC-rho))*uMn.y;
n=normalize(vec3(0.0,uTc.x,uTc.y)-g*vec3(e.x,-e.y*uTc.y,e.y*uTc.x));}else n=normalize(vN);
float ndv=max(dot(n,v),0.0),hf=(vP.y-uF.x)/uF.y;
vec3 bg=pow(mix(texture2D(tMap,gl_FragCoord.xy/uRes-n.xy*uRf.xy*(1.0-ndv*uRf.z)).rgb,uFlat,uUseFlat),vec3(uY));
vec3 c=mix(mix(mix(uK0,uK1,smoothstep(uB.x-uE,uB.x+uE,hf)),uK2,smoothstep(uB.y-uE,uB.y+uE,hf)),uK3,smoothstep(uB.z-uE,uB.z+uE,hf));
float d=vC>0.5?min((vP.y-uF.x)/sqrt(1.0-(1.0-ndv*ndv)/uEta),uD0):2.0*rho*ndv;
vec3 T=pow(c,vec3(d/uD0)),col=bg*T+c*(1.0-dot(T,vec3(0.2126,0.7152,0.0722)))*uSc*uW;
if(vC>0.5){float F=uFr.x+uFr.y*pow(1.0-ndv,uFr.z);vec3 r=reflect(-v,n),h=normalize(uI+v);
col=mix(col,mix(uDark,uW,smoothstep(uSk.x,uSk.y,r.y)),F*uRl)+uW*(pow(max(dot(n,h),0.0),uSp.x)*uSp.y+F*uSn);}
gl_FragColor=vec4(pow(max(col,0.0),vec3(1.0/uY)),1.0);}`;
/**
 * The stream (STREAM_VERT): the tube's rings laid between the span's two ends (uSpan: the top and the head, jar units),
 * the radius by mass conservation from the fall uH (g, v0, the source's height, the radius there), each end rounded
 * over its tip length (uTip, 0 while the end is not free), the fade-in under the source over uFd, and the parcel's
 * shade by its emission time against the switches uSw (uS0 to uS3), interpolated between rings into a soft seam.
 */
const STREAM_VERT = /* glsl */`uniform float uT,uFd;uniform vec2 uSpan,uTip;uniform vec3 uSw,uS0,uS1,uS2,uS3;uniform vec4 uH;varying vec3 vK;varying vec3 vN;varying vec3 vV;varying float vA;
void main(){float s=position.y,y=mix(uSpan.x,uSpan.y,s),v=sqrt(uH.y*uH.y+2.0*uH.x*(uH.z-y)),r=uH.w*sqrt(uH.y/v);
if(uTip.x>0.0)r*=sqrt(clamp((uSpan.x-y)/uTip.x,0.0,1.0));if(uTip.y>0.0)r*=sqrt(clamp((y-uSpan.y)/uTip.y,0.0,1.0));
float te=uT-(v-uH.y)/uH.x;vK=te<uSw.x?uS0:te<uSw.y?uS1:te<uSw.z?uS2:uS3;vA=smoothstep(0.0,uFd,uH.z-y);
vec3 n=vec3(position.x,0.0,position.z);vec4 m=modelViewMatrix*vec4(n.x*r,y,n.z*r,1.0);vN=normalize(normalMatrix*n);vV=-m.xyz;gl_Position=projectionMatrix*m;}`;
/** a parcel (STREAM_FRAG): its shade lit flat by the ambient uA and the light uW, one specular streak from the key uI (uSt: power, weight), the alpha uAl.x fading at the silhouette over uAl.y as the tube's anti-aliasing */
const STREAM_FRAG = /* glsl */`precision highp float;uniform vec3 uA,uW,uI;uniform vec2 uSt,uAl;uniform float uY;varying vec3 vK;varying vec3 vN;varying vec3 vV;varying float vA;
void main(){vec3 n=normalize(vN),v=normalize(vV),h=normalize(uI+v),c=vK*(uA+0.5*uW)+uW*pow(max(dot(n,h),0.0),uSt.x)*uSt.y;
gl_FragColor=vec4(pow(c,vec3(1.0/uY)),uAl.x*vA*smoothstep(0.0,uAl.y,max(dot(n,v),0.0)));}`;
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
/** a colour uniform in linear light */
const col = () => ({ value: new Float32Array(3) });

/** one stream: the presses it carries, the wall clock at its start (the loop's seconds), its schedule and the hooks' clock */
interface Stream { ids: string[]; t0: number; sched: Schedule; scrub: number | null }

export function createJars(o: JarsOptions): JarsScene {
  const { renderer, root, reduced } = o;
  const H = document.documentElement;
  const body = root.querySelector<HTMLElement>('.su-body');
  const slotEl = root.querySelector<HTMLElement>('.su-slot[data-slot="yours"]');
  // each shade's hex, joined at build into its follow link's markup (Signup.astro) in the follow's shades order, so
  // the shade table never ships in this chunk
  const links = [...root.querySelectorAll<HTMLElement>('a.su-follow[data-id]')];
  const hexes = new Map<string, string>();
  for (const f of SIGNUP_FOLLOWS) {
    const list = (links.find((a) => a.dataset.id === f.id)?.dataset.colours ?? '').split(',');
    f.shades.forEach((id, k) => { if (/^#[0-9a-f]{6}$/i.test(list[k] ?? '')) hexes.set(id, list[k].toLowerCase()); });
  }
  const hexOf = (id: string): string => hexes.get(id) ?? NIGHT;
  const setCol = (u: { value: Float32Array }, id: string) => { u.value.set(linearOf(hexOf(id))); };
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
    // the slot, its block and the body's own blocks as well: the body fills the screen whatever it holds, so a block
    // changing inside it (a late font, the decode's wrap at mount) can move the slot with no change to the body's size
    watch: [root, body, ...(body ? [...body.children] : []), root.querySelector('.su-jar'), slotEl, document.getElementById('find'), document.getElementById('room'), H],
    onMeasure: (l) => { top = l.top; height = l.height; o.onLayout?.(); },
  });
  const current = () => { if (!Number.isFinite(top)) lay.measure(); else lay.get(); };

  // ---- the stage: a fixed camera, the fog quad, the liquid's body, the stream's tube, the glass; two targets
  const cam = new PerspectiveCamera(JAR.fovDeg, 1, 0.1, 100);
  cam.position.set(0, 0, JAR.distance); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const fsGeo = new BufferGeometry(); fsGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const copyU = { tMap: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uFlat: { value: hex3(NIGHT) }, uUseFlat: { value: 0 } };
  const copyMat = new ShaderMaterial({ uniforms: copyU, vertexShader: FS_VERT, fragmentShader: COPY_FRAG, depthTest: false, depthWrite: false });
  const copyMesh = new Mesh(fsGeo, copyMat); copyMesh.frustumCulled = false;
  const copyScene = new Scene(); copyScene.add(copyMesh);
  const keyDir = new Vector3(0.3, 0.8, 0.55).normalize(), dark = new Vector3(0.22, 0.24, 0.3);
  // the light the body and the stream share (one object each, so a write reaches both programs): the gamma, the key, the ambient, the light's colour in linear light
  const light = { uY: { value: GAMMA }, uI: { value: keyDir }, uA: { value: new Vector3(0.42, 0.43, 0.47) }, uW: { value: Float32Array.from(linearOf(PEARL_WHISPER)) }, uT: { value: 0 } };
  const liqU = {
    ...light, tMap: copyU.tMap, uRes: copyU.uRes, uFlat: copyU.uFlat, uUseFlat: copyU.uUseFlat,
    uL: { value: 0 }, uF: { value: new Vector2(levelY(0), JAR.shoulder - JAR.floor) }, uC: { value: profileR(levelY(0)) }, uTc: { value: new Float32Array(2) },
    uB: { value: new Float32Array([1, 1, 1, 1]) }, uK0: col(), uK1: col(), uK2: col(), uK3: col(), uE: { value: LIQ.seam },
    uD0: { value: LIQ.d0 }, uEta: { value: LIQ.eta2 }, uSc: { value: LIQ.scatter },
    uFr: { value: Float32Array.from(LIQ.fresnel) }, uSk: { value: Float32Array.from(LIQ.sky) }, uDark: { value: dark }, uRl: { value: LIQ.reflect },
    uSp: { value: Float32Array.from(LIQ.spec) }, uSn: { value: LIQ.sheen }, uMn: { value: Float32Array.from(LIQ.meniscus) },
    uRp: { value: new Float32Array([LIQ.rippleSlope, K, LIQ.rippleSpeed * K, LIQ.rippleDecay]) }, uDm: { value: new Float32Array([(2 * LIQ.dimpleDepth) / LIQ.dimpleR, LIQ.dimpleR, LIQ.dimpleRim]) },
    uRw: { value: 0 }, uDw: { value: 0 }, uRf: { value: new Float32Array([0, 0, 0.6]) },
  };
  const tubeU = {
    ...light, uFd: { value: LIQ.fadeIn }, uSpan: { value: new Float32Array([LIQ.srcY, LIQ.srcY]) }, uTip: { value: new Float32Array(2) },
    uH: { value: new Float32Array([LIQ.g, LIQ.v0, LIQ.srcY, LIQ.r0]) }, uSw: { value: new Float32Array([NEVER, NEVER, NEVER]) }, uS0: col(), uS1: col(), uS2: col(), uS3: col(),
    uSt: { value: Float32Array.from(LIQ.streak) }, uAl: { value: new Float32Array([LIQ.streamAlpha, LIQ.aa]) },
  };
  const glassShared = { tFrame: { value: null as Texture | null }, uRes: { value: new Vector2(8, 8) }, uKey: { value: keyDir }, uLightCol: { value: hex3(PEARL_WHISPER) }, uDark: { value: dark }, uTint: { value: new Vector3(0.96, 0.98, 1.0) } };
  const sceneA = new Scene(), sceneB = new Scene();
  const fogQuad = new Mesh(fsGeo, copyMat); fogQuad.frustumCulled = false; fogQuad.renderOrder = -10; sceneA.add(fogQuad);
  const copyB = new Mesh(fsGeo, copyMat); copyB.frustumCulled = false; copyB.renderOrder = -10; sceneB.add(copyB);
  let rtA = new WebGLRenderTarget(8, 8, { depthBuffer: true }), rtB = new WebGLRenderTarget(8, 8, { depthBuffer: true });
  // the body: the lathe, one opaque draw writing depth, hidden at level 0
  const lb = liquidBody(), bodyGeo = new BufferGeometry();
  bodyGeo.setAttribute('position', new Float32BufferAttribute(lb.position, 3)); bodyGeo.setAttribute('normal', new Float32BufferAttribute(lb.normal, 3)); bodyGeo.setIndex(new BufferAttribute(lb.index, 1));
  const liqMat = new ShaderMaterial({ uniforms: liqU, vertexShader: LIQ_VERT, fragmentShader: LIQ_FRAG, transparent: false, depthTest: true, depthWrite: true, side: FrontSide });
  const liquid = new Mesh(bodyGeo, liqMat); liquid.frustumCulled = false; liquid.visible = false; liquid.renderOrder = 0; sceneA.add(liquid);
  // the stream: the tube, blended after the body with no depth written, visible only while a span runs
  const tb = tubeGeometry(), tubeGeo = new BufferGeometry();
  tubeGeo.setAttribute('position', new Float32BufferAttribute(tb.position, 3)); tubeGeo.setIndex(new BufferAttribute(tb.index, 1));
  const tubeMat = new ShaderMaterial({ uniforms: tubeU, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, transparent: true, depthTest: true, depthWrite: false });
  const tube = new Mesh(tubeGeo, tubeMat); tube.frustumCulled = false; tube.visible = false; tube.renderOrder = 1; sceneA.add(tube);
  // the glass: jar.bin's geometry once it is in
  const glassMat = new ShaderMaterial({ uniforms: { ...glassShared, uRefract: { value: new Vector2(0, 0) } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, side: FrontSide });
  const glass = new Mesh(new BufferGeometry(), glassMat); glass.frustumCulled = false; glass.visible = false; sceneB.add(glass);
  let jarGeo: BufferGeometry | null = null;
  const _cc = new Color();
  const setTilt = (deg: number) => { tiltDeg = deg; const t = (deg * Math.PI) / 180; liqU.uTc.value.set([Math.cos(t), Math.sin(t)]); };
  setTilt(tiltDeg);
  /** the glass's and the liquid's refraction offsets at the silhouette, as shares of a frame of w by h, for a jar px tall */
  const setRefract = (px: number, w: number, h: number) => { glassMat.uniforms.uRefract.value.set((JAR.refract * px) / w, (JAR.refract * px) / h); liqU.uRf.value[0] = (LIQ.refract * px) / w; liqU.uRf.value[1] = (LIQ.refract * px) / h; };

  // ---- the state: the follows in press order, the level, the running stream and the queue
  const domFollows = (): string[] => [...root.querySelectorAll<HTMLElement>('li.su-follow-row[data-collected]')].sort((a, b) => Number(a.dataset.collected) - Number(b.dataset.collected)).map((li) => li.dataset.id ?? '').filter(Boolean);
  let order: string[] = domFollows(), level = 0, stream: Stream | null = null, span: { top: number; head: number } | null = null, placement: Placement | null = null, slot: Slot | null = null;
  const queue: string[] = [];
  const setLevel = (v: number) => { level = v; liqU.uL.value = v; liqU.uC.value = profileR(levelY(v)); };
  const setRipple = (rw: number, dw: number) => { liqU.uRw.value = rw; liqU.uDw.value = dw; };
  const setLayers = (ids: readonly string[]) => { const { tops, shades } = layerBands(ids); liqU.uB.value.set(tops); [liqU.uK0, liqU.uK1, liqU.uK2, liqU.uK3].forEach((u, k) => setCol(u, shades[k])); };
  const clock = (s: Stream): number => s.scrub ?? lastT - s.t0;
  const poured = (id: string) => dispatchEvent(new CustomEvent('skreed:signup-poured', { detail: { id, level: +level.toFixed(3) } }));
  /** the uniforms a schedule sets: the switches and the parcels' shades */
  function applyStream(s: Stream) {
    const sc = s.sched, sh = sc.shades;
    tubeU.uSw.value.set([sc.switches[0] ?? NEVER, sc.switches[1] ?? NEVER, sc.switches[2] ?? NEVER]);
    [tubeU.uS0, tubeU.uS1, tubeU.uS2, tubeU.uS3].forEach((u, k) => setCol(u, sh[Math.min(k, sh.length - 1)]));
  }
  function startStream(id: string) {
    const j = jarById(id);
    if (!j) return;
    stream = { ids: [id], t0: lastT, sched: pourSchedule(j.worth, level, j.shades), scrub: null };
    applyStream(stream);
  }
  function finish(s: Stream) {
    stream = null; span = null;
    setLevel(s.sched.to); setRipple(0, 0);
    poured(s.ids[s.ids.length - 1]);
    const next = queue.shift();
    if (next) startStream(next);
  }
  /** the stream's clock this frame: the level, the ripple's weights and the span by the schedule; the end at the total */
  function advance() {
    const s = stream;
    if (!s) return;
    const t = clock(s), sc = s.sched;
    if (t >= sc.total) { finish(s); return; }
    setLevel(pourLevel(sc, t, false)); light.uT.value = t; setRipple(rippleWeight(t, sc), dimpleWeight(t, sc));
    const sp = streamSpan(t, sc);
    span = sp;
    if (sp) { tubeU.uSpan.value.set([sp.top, sp.head]); tubeU.uTip.value.set([sp.topTip, sp.headTip]); }
  }
  /** a press: a stream from a standstill, the running stream extended while it emits, or the press queued */
  function press(id: string) {
    const j = jarById(id);
    if (!j) return;
    if (reduced) { setLevel(yoursLevel(order)); poured(id); return; }
    if (!stream) { startStream(id); return; }
    const ext = extendPour(stream.sched, j.worth, j.shades, clock(stream));
    if (ext) { stream.sched = ext; stream.ids.push(id); applyStream(stream); } else queue.push(id);
  }
  /** the follows as they stand: the jar set at its level, banded, no stream */
  function setAtOnce(ids: readonly string[]) {
    order = ids.filter((id) => jarById(id)); setLayers(order);
    stream = null; span = null; queue.length = 0;
    setLevel(yoursLevel(order)); setRipple(0, 0);
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
  const pose = (m: Mesh, p: Placement) => { m.position.set(p.x, p.y, 0); m.scale.setScalar(p.scale); m.rotation.x = (tiltDeg * Math.PI) / 180; m.updateMatrixWorld(); };
  const show = (v: boolean) => { liquid.visible = v && level > 0; tube.visible = v && !!span; glass.visible = v; };
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
    pose(liquid, p); pose(tube, p); pose(glass, p);
    setRefract(p.px, Math.max(1, view.w), Math.max(1, view.h));
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
        order = domFollows();   // the DOM as it stands now: the DOM script may have marked the saved follows since this chunk was made
        if (!stream) setAtOnce(order); else setLayers(order);
        // the programs, one a frame, with a target bound (three keys each program on the target); the tube visible at a zero-length span, so the stream's program is warm before the first press
        if (!warmed) {
          warmed = true;
          liquid.visible = true; tube.visible = true; glass.visible = true;
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
      rtA.dispose(); rtB.dispose(); copyMat.dispose(); fsGeo.dispose(); bodyGeo.dispose(); tubeGeo.dispose(); liqMat.dispose(); tubeMat.dispose(); glassMat.dispose(); jarGeo?.dispose();
      if (window.__skreedSignup === api) window.__skreedSignup = undefined;
    },
  };
  // the hooks (section-5-liquid.md 6, "Hooks"; D10): one block the production build drops, as loop.ts and director.ts fold theirs
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    /** the jar at the bands of an order over --night, 320 x 400, the surface still, the tilt, no stream; the pixels bottom-up */
    api.still = async (ids, lv): Promise<SignupStill | null> => {
      if (!ready || disposed) return null;
      const w = 320, h = 400, c = new PerspectiveCamera(JAR.fovDeg, w / h, 0.1, 100);
      c.position.set(0, 0, JAR.distance); c.lookAt(0, 0, 0); c.updateMatrixWorld(); c.updateProjectionMatrix();
      const mid = new WebGLRenderTarget(w, h, { depthBuffer: true }), out = new WebGLRenderTarget(w, h, { depthBuffer: true });
      const was = { level, rw: liqU.uRw.value, dw: liqU.uDw.value };
      try {
        const list = ids.filter((id) => jarById(id)), L = lv ?? yoursLevel(list);
        setLayers(list); setLevel(L); setRipple(0, 0);
        const p = placeJar({ x: 0, y: 0, w, h }, { w, h }, tiltDeg);
        pose(liquid, p); pose(glass, p);
        setRefract(p.px, w, h);
        liquid.visible = L > 0; tube.visible = false; glass.visible = true;
        draw(null, true, out, mid, c);
        const data = new Uint8Array(w * h * 4);
        renderer.readRenderTargetPixels(out, 0, 0, w, h, data);
        return { width: w, height: h, data };
      } finally {
        setLayers(order); setLevel(was.level); setRipple(was.rw, was.dw);
        mid.dispose(); out.dispose();
      }
    };
    /** while a number, the running stream reads it as its clock every frame; null lets the wall clock run on from it */
    api.scrub = (t) => {
      const s = stream;
      if (!s) return;
      if (t === null) { if (s.scrub !== null) { s.t0 = lastT - s.scrub; s.scrub = null; } } else s.scrub = t;
    };
    api.tilt = (deg) => { setTilt(deg); };
    api.hooks = () => {
      const s = stream, sc = s?.sched, t = s ? clock(s) : 0, lb2 = layerBands(order);
      let acc = 0;
      return {
        ready, failed, order: [...order], level: +level.toFixed(3), target: yoursLevel(order),
        pour: s && sc ? { id: s.ids[s.ids.length - 1], ids: [...s.ids], t, phase: t < sc.lead ? 'lead' : t < sc.landEnd ? 'pour' : 'tail', lead: sc.lead, pour: sc.pour, emit: sc.emit, landEnd: sc.landEnd, total: sc.total, switches: [...sc.switches], colours: sc.shades.map(hexOf) } : null,
        queue: [...queue],
        layers: order.map((id) => { const j = jarById(id)!, from = acc; acc = Math.min(1, acc + j.worth / WORTH_TOTAL); return { id, from, to: acc, hexes: j.shades.map(hexOf) }; }),
        surface: { ripple: liqU.uRw.value, dimple: liqU.uDw.value, span: span ? { ...span } : null },
        tops: [...lb2.tops], colours: lb2.shades.map(hexOf),
        layout: lay.layout ? { ...lay.layout, bodyBottom } : null,
        slot: slot ? { ...slot } : null, placed: placement ? { ...placement, box: { ...placement.box } } : null,
        view: { w: cssW, h: cssH, rt: [rtA.width, rtA.height] },   // the view the placement and the camera were taken in, and the targets' size
      };
    };
  }
  window.__skreedSignup = api;
  return api;
}
