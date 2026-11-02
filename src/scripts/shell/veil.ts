// The --night veil a jump on the landing page happens under (BackToTop.astro's #toTopVeil; DESIGN.md "Back to top"): it
// fades in over 250 ms, the page jumps in place, and it lifts once the hero has drawn its rest frame. Shared by Back to
// top's way back (to-top.ts) and the section index (site-nav.ts). Reduced motion, or no veil on the page: the jump alone.
import { reducedMQ } from '../motion.ts';

export const VEIL_MS = 250;
type Run = () => void | Promise<void>;
type Job = { run: Run; covered: boolean };
const veil = () => document.getElementById('toTopVeil');
const frames = (n: number) => new Promise<void>((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
let busy = false, next: Job | null = null;

/** the veil on at once, opaque, whatever it was doing */
const pin = (v: HTMLElement) => { v.getAnimations().forEach((a) => a.cancel()); v.hidden = false; v.style.opacity = '1'; };
/** the veil off: two frames first (the hero draws its rest frame under it), then a 250 ms fade */
async function lift(v: HTMLElement): Promise<void> {
  await frames(2);
  await v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: VEIL_MS, easing: 'linear', fill: 'forwards' }).finished.catch(() => {});
  if (next?.covered) return;   // a restore came in during the lift and pinned the veil again: it stays up for that jump
  v.hidden = true; v.getAnimations().forEach((a) => a.cancel()); v.style.opacity = '';
}
/** a jump that throws must not leave the veil up over the page */
const safe = async (run: Run) => { try { await run(); } catch (e) { console.warn('veil: a jump failed', e); } };

/**
 * Run under the veil: in over 250 ms (at once with `covered`, for a page restored from the back-forward cache, which
 * must not show where it was), run, lift. A press while a jump is under way is never lost: the latest one runs under the
 * same veil when it came before the lift, or as a jump of its own once the lift is over; a covered one pins the veil at
 * once wherever it arrives. Under reduced motion there is no veil, but the jumps still run one at a time in that order.
 */
export async function veiled(run: Run, o: { covered?: boolean } = {}): Promise<void> {
  const el = veil(), v = el && !reducedMQ.matches ? el : null, covered = !!o.covered;
  if (busy) { next = { run, covered: covered || !!next?.covered }; if (v && covered) pin(v); return; }
  busy = true;
  try {
    if (v) {
      if (covered) pin(v);
      else { v.hidden = false; await v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: VEIL_MS, easing: 'linear', fill: 'forwards' }).finished.catch(() => {}); }
    }
    await safe(run);
    for (let j = next; j; j = next) { next = null; await safe(j.run); }
    if (v) await lift(v);
  } finally { busy = false; }
  const after = next;
  next = null;
  if (after) void veiled(after.run, { covered: after.covered });
}
