// The gems' click hint (Sam, 2026-11-04: "we need an accessibility helper or smtg on the phone aspect ratio which makes
// the user knnow that the stones are clickable, maybe like a mouse cursor going around the stones and have a click
// animation, a cute one, so they will also try to click"; later that day "make it small ... when it hovers over the
// stone, make the cursor into the clickable cursor" and "have the same click hint for desktop as well"; E-S2-hint). A
// cursor of our own drawing (two inline SVGs, no icon set), small as a pointer is, glides to a gem as an arrow, turns into
// the pointing hand over it, presses it with a small squash and a ring, and the gem answers as it does to a finger: its
// frost and its CTA ("TAP TO EXPLORE" on a touch screen, "CLICK TO EXPLORE" with a mouse; on a phone in its name's place,
// on a laptop with the plexus). On every layout once the gems have rested a second with their links on and no mouse on
// one, never under reduced motion; two short tours of three gems at most per rest, hidden the moment the page scrolls;
// gone for the visit after the visitor's own tap or click on a gem. aria-hidden and pointer-events none: a picture of a
// tap, never a control, so it never takes a tap from the gems.
export const HINT = Object.freeze({
  /** the rest the gems need before the hint starts, in ms */
  restMs: 1000,
  /** one tap: the glide to the gem, the press, the hold while the gem answers (ms) */
  moveMs: 900, pressMs: 360, holdMs: 1250,
  /** the gems a tour visits (catalog order 0 to 9: down the phone's zigzag column, across a laptop's two rows), and the pause between the two tours */
  tours: [[1, 4, 7], [2, 5, 8]] as readonly (readonly number[])[],
  pauseMs: 4000,
  /** the visit's flag: set once the visitor has tapped a gem themself */
  key: 'skreed:s2-hint-done',
});

export interface HintOptions {
  layer: HTMLElement;
  /** gem j's centre on the screen in CSS px, or null when it is not there */
  centre(j: number): [number, number] | null;
  /** whether a gem is under (x, y), as the canvas's own pick finds it: the cursor is the hand over any gem, as a pointer over a link */
  onGem(x: number, y: number): boolean;
  /** the hint's press on gem j at (x, y): the gem answers as to a finger */
  tap(j: number, x: number, y: number): void;
  /** the press is over: the gem lets its answer go */
  release(j: number): void;
}

// two cursors of our own drawing, as a pointer changes over a link (Sam, 2026-11-04: "make it small ... when it hovers
// over the stone, make the cursor into the clickable cursor"): the arrow while it glides, the pointing hand once it is
// over the gem; each placed so its hot spot (the arrow's tip, the forefinger's tip) is the element's origin (shell.css)
const ARROW = '<svg class="arrow" viewBox="0 0 26 33"><path d="M3 2.6V24.9Q3 27 4.6 25.8L9.5 21.3 13.3 29.5Q14.1 31.2 15.8 30.5L18.2 29.4Q19.8 28.6 19 27L15.3 18.9 22 18.6Q24 18.5 22.5 17L4.8 1.4Q3 0 3 2.6Z"/></svg>';
const HAND = '<svg class="hand" viewBox="0 0 20 24"><path d="M6 2.5a1.5 1.5 0 0 1 3 0V10a1.25 1.25 0 0 1 2.5 0V11a1.25 1.25 0 0 1 2.5 0V12a1.25 1.25 0 0 1 2.5 0V17q0 5-5 5H10q-3 0-4.8-2.6L2.6 14.6a1.3 1.3 0 0 1 2-1.7L6 14.5Z"/><path class="seam" d="M9 10v3M11.5 11v2.6M14 12v2.2"/></svg>';
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (2 - 2 * x) ** 3 / 2);
const done = () => { try { return sessionStorage.getItem(HINT.key) === '1'; } catch { return false; } };

export function createHint(o: HintOptions) {
  const el = document.createElement('div');
  el.className = 's2hint'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="s2hint-ring"></span><span class="s2hint-pt">${ARROW}${HAND}</span>`;
  const ring = el.firstElementChild as HTMLElement, pt = el.lastElementChild as HTMLElement;
  const over = (on: boolean) => el.classList.toggle('over', on);
  o.layer.append(el);
  let off = done(), shown = false, restT = 0, lastS = NaN, lastH = NaN;
  // the run: which tour, which stop, the phase and its start, where the glide began
  let tour = 0, stop = 0, phase: 'idle' | 'move' | 'press' | 'hold' | 'pause' | 'over' = 'idle', t0 = 0, from: [number, number] = [0, 0], pos: [number, number] = [0, 0], pressed = -1;
  const show = (on: boolean) => { if (on !== shown) { shown = on; el.classList.toggle('on', on); } };
  const place = (x: number, y: number, sq = 0) => {
    pos = [x, y];
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    pt.style.transform = sq ? `scale(${(1 + 0.08 * sq).toFixed(3)}, ${(1 - 0.16 * sq).toFixed(3)}) rotate(${(-6 * sq).toFixed(2)}deg)` : '';
  };
  const letGo = () => { if (pressed >= 0) { o.release(pressed); pressed = -1; } };
  function reset() { letGo(); show(false); over(false); phase = 'idle'; tour = 0; stop = 0; }
  /** the visitor tapped a gem themself: they know, so the hint is gone for the visit */
  function dismiss() { off = true; reset(); try { sessionStorage.setItem(HINT.key, '1'); } catch { /* no storage: gone for this page */ } }
  function begin(now: number) {
    const c = o.centre(HINT.tours[tour][0]); if (!c) return;
    // it comes in from below and to the side of its first gem, so the glide is seen
    from = [c[0] + (c[0] > innerWidth / 2 ? -1 : 1) * 70, c[1] + 110]; place(from[0], from[1]); show(true);
    over(false); phase = 'move'; stop = 0; t0 = now;
  }
  /** per frame: eligible when the gems are at rest with their links on and no mouse on one; S is the scroll in screens, h the viewport's height */
  function step(now: number, eligible: boolean, S: number, h: number) {
    // a new viewport height moves S with no scroll (S is scrollY over the height): re-based, never read as a scroll
    if (h !== lastH) { lastH = h; lastS = S; }
    if (!(Math.abs(S - lastS) <= 1e-4)) { lastS = S; restT = now; if (phase !== 'idle') reset(); }   // a scroll ends the run; the next rest starts a new one
    // a run that has played both tours stays over until the next scroll, whatever else comes and goes (a hidden tab, a resize)
    if (off || !eligible) { if (phase !== 'idle' && phase !== 'over') reset(); return; }
    if (phase === 'idle') { if (now - restT >= HINT.restMs) begin(now); return; }
    if (phase === 'over') return;
    if (phase === 'pause') { if (now - t0 >= HINT.pauseMs) begin(now); return; }
    const j = HINT.tours[tour][stop], c = o.centre(j);
    if (!c) { reset(); return; }
    const e = now - t0;
    if (phase === 'move') {
      const k = ease(Math.min(1, e / HINT.moveMs)), lift = Math.sin(Math.PI * k) * 26;   // a small arc, not a straight slide
      place(from[0] + (c[0] - from[0]) * k, from[1] + (c[1] - from[1]) * k - lift);
      over(o.onGem(pos[0], pos[1]));   // the arrow between gems, the hand over any of them
      if (e >= HINT.moveMs) { phase = 'press'; t0 = now; }
    } else if (phase === 'press') {
      const k = Math.min(1, e / HINT.pressMs);
      place(c[0], c[1], Math.sin(Math.PI * k));
      over(true);
      if (pressed < 0 && k >= 0.5) {
        pressed = j; o.tap(j, c[0], c[1]);
        ring.animate([{ transform: 'scale(0.3)', opacity: 0.9 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
      }
      if (k >= 1) { phase = 'hold'; t0 = now; }
    } else if (phase === 'hold') {
      place(c[0], c[1]);
      if (e >= HINT.holdMs) {
        letGo(); from = [pos[0], pos[1]]; t0 = now;
        if (++stop < HINT.tours[tour].length) phase = 'move';
        else { show(false); phase = ++tour < HINT.tours.length ? 'pause' : 'over'; }
      }
    }
  }
  return { step, dismiss, get running() { return phase !== 'idle' && phase !== 'over'; }, get pressed() { return pressed; }, dispose() { letGo(); el.remove(); } };
}
