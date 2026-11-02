// Section 5's jar renders by state (C2 in docs/specs/section-5-picture.md): the sixteen states' files read by name with
// import.meta.glob, a state kept only with all four of its files (AVIF and WebP at 1x and 2x), and jars.json's frame,
// the jar's box and each state's surface top. Read by Signup.astro at build time (the three showcase jars and jar 4's
// first picture go into the markup) and by the page script at runtime (the next states' pictures), so the table of the
// sixteen states' URLs rides the script's lazy chunk and never the first view's markup. A build without the renders
// gives an empty table and C2's default frame, and the page still builds.
import { JARS_DEFAULT, SIGNUP_STATES, type JarsManifest } from '../../config/signup.ts';

const files = import.meta.glob<string>('../../assets/signup/jars/*.{avif,webp}', { eager: true, query: '?url', import: 'default' });
// jars.json's three parts, each by its own named export, so the page script's chunk bundles the states' tops alone and the
// frame, the jar's box and the renders' notes stay with the page at build time (Rollup drops the exports a chunk never reads)
const frames = import.meta.glob<JarsManifest['frame']>('../../assets/signup/jars/jars.json', { eager: true, import: 'frame' });
const boxes = import.meta.glob<JarsManifest['jar']>('../../assets/signup/jars/jars.json', { eager: true, import: 'jar' });
const tops = import.meta.glob<JarsManifest['states']>('../../assets/signup/jars/jars.json', { eager: true, import: 'states' });
/** the one entry of a glob over one file (marked pure where it is read, so a chunk that never reads JARS drops the frame and the box with it) */
const first = <T>(o: Record<string, T>): T | undefined => Object.values(o)[0];
const frame = /* @__PURE__ */ first(frames), box = /* @__PURE__ */ first(boxes);
/** each state's surface top from jars.json ('0': the inner floor), or none without the renders */
export const STATE_TOPS: JarsManifest['states'] = /* @__PURE__ */ first(tops) ?? {};
/** jars.json as the build found it (the frame, the jar's box, the states' tops), or C2's default frame without the renders */
export const JARS: JarsManifest = frame && box ? { frame, jar: box, states: STATE_TOPS } : JARS_DEFAULT;
/** a state's renders: the AVIF and WebP srcsets (200w and 400w) and the fallback (the 1x WebP); the surfaces are STATE_TOPS */
export interface Srcs { a: string; w: string; s: string }
const srcs = (state: string): Srcs | null => {
  const f = (k: string) => files[`../../assets/signup/jars/jar-${state}-${k}`];
  const a1 = f('1x.avif'), a2 = f('2x.avif'), w1 = f('1x.webp'), w2 = f('2x.webp');
  return a1 && a2 && w1 && w2 ? { a: `${a1} 200w, ${a2} 400w`, w: `${w1} 200w, ${w2} 400w`, s: w1 } : null;
};
/** every state that has all four files, by its name */
export const STATE_SRCS: Record<string, Srcs> = Object.fromEntries(SIGNUP_STATES.map((s) => [s, srcs(s)]).filter((e): e is [string, Srcs] => !!e[1]));
/** the pictures' sizes attribute: the frame is twice the jar's diameter (0.36 of the column on a phone, at most 240 px wide on a laptop) */
export const SIZES = '(min-width: 720px) 240px, 36vw';
