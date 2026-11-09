// The shade picker and "THIS IS JUST A GLIMPSE." in motion (docs/specs/redesign.md D10, third clip; D19, item 5;
// sections 6 and 7; E-RD-motion; Sam, 2026-11-09, of the Canva clip the PDF holds one frame of: "Live animations",
// and of the first build, where a dot had to be pressed: "for the color changing section, instead of clicking, make
// the color change happen just with hover, no need for click").
//
// The picker. Five radio inputs (src/components/redesign/Glimpse.astro), one picture per shade in one stage. A change
// of shade marks the radio and the alt text at once (and the live region, see the demo below), waits for the new
// picture if it has not decoded (0.9 s at most, spec section 7), then plays: the new picture is revealed over the old
// by a circle growing from the products' centre (clip-path: circle(), 0.7 s, written through the CSSOM), the products
// dip 2% and return, the old line leaves upward as the new one arrives from below, and the name is re-lettered left
// to right, 25 ms a letter. A second change while one plays lands the first at once, and one that was still waiting
// for its picture gives way, so a pointer that crosses several dots quickly leaves the last one's shade, whole: no
// layer half shown, the name, the line and the picture all the checked dot's. The other four pictures are fetched
// when the section is a screen away. Until the motion kit is here, and if it never comes, a change is a cut: the
// picker needs no GSAP to work.
//
// What changes the shade. A mouse, or a pen held over the screen, that moves over a dot takes that dot's shade at
// once, and nothing is pressed. The listener reads the pointer's own movement (pointermove), so a dot the page
// carries under a pointer at rest changes nothing by itself, and a pointer that leaves the dots changes nothing
// either: the last shade stays. A finger has no hover, nor has a pen once it is on the glass, so there the tap is
// the way, the radio's own click; the arrow keys and a mouse's click are the radios' own too, as they were.
// The row itself never changes: its discs stand as the frame draws them, each over the one before, whichever is chosen
// (rd-glimpse.css), so nothing here touches a disc after its entrance.
//
// The demo. While the box is on screen and until the visitor takes over, a cursor of our own drawing glides over the
// dots one after another, a glide every 2.6 s, and the shade changes as its tip comes over each dot, as it does
// under the visitor's own pointer: it presses nothing (no squash, no ring). From the last dot it goes back to the
// first under the row, clear of the dots between. It leaves for good the first time the visitor's own pointer comes
// over a dot, a finger taps one, a key is pressed on them or focus arrives on them (so a keyboard never finds the
// chosen dot moving under it). It never takes focus and never scrolls anything. While it plays the live region is
// switched off, so a screen reader is not told of a change every 2.6 s; the visitor's own changes are said once each:
// a key's, a tap's and a click's at once, a pointer's when it has rested a quarter of a second on its dot, so a
// pointer that crosses the row is said where it stops and not at every dot on its way.
//
// The band. The headline's two lines slide in from the left behind their masks, then drift apart as the band crosses
// the screen (scrubbed), and the photograph travels its spare height (motion.ts, parallax).
//
// No copy and no catalog here: every string comes from the markup's data attributes. Every listener here is passive,
// and none is on the wheel or on a touch: nothing of the picker can hold the page, and the arrow keys are the radios' own.
import { enter, lines, mask, onMotion, parallax, type Kit } from './motion.ts';

/** how long a change waits for a picture that has not decoded */
const WAIT_MS = 900;
/** the reveal's centre, as shares of the picture: the middle of the products' own box, which runs from 38 to 981 of
 * the picture's 1040 px across and from 66 to 928 of its 1000 px down */
const CENTRE = { x: 0.49, y: 0.497 } as const;
const REVEAL_S = 0.7;
/** the products' dip, in per cent of their height */
const DIP = 2;
/** the name's letters: the first changes this long into a change, each next one 25 ms later */
const NAME = { at: 0.14, step: 0.025 } as const;
/** the demo: a glide starts every 2.6 s; the cursor's tip rests a little right of and under the last dot's middle, as in
 * the PDF's frame (6u and 8.6u from the middle of a 51.5u dot), and at that height in the middle of what can be seen of
 * any other dot (`crescent`, a share of the disc: the next disc lies over the rest). On to the next dot the tip dips
 * `sag` px at the least; back from the last dot to the first it drops `under` of a dot's height below the row and starts
 * up again only `rise` of the way through the glide, by when it stands under the first dot, so it crosses no dot between */
const DEMO = { every: 2.6, glide: 0.9, rest: 1.1, tip: { x: 0.62, y: 0.67 }, crescent: 0.34, sag: 5, under: 0.25, rise: 0.65 } as const;
/** how long the visitor's pointer rests on a dot before the live region says that dot's shade */
const SAY_MS = 250;
/** how far each headline line drifts as the band crosses the screen, in em of the headline, either way of its place */
const DRIFT = 0.08;
/** the picker's listeners hold nothing back: none of them can prevent what the browser does with an event */
const QUIET = { passive: true } as const;

interface Dot { readonly el: HTMLElement; readonly input: HTMLInputElement; readonly disc: HTMLElement; readonly id: string; readonly name: string; readonly line: string }
interface Pic { readonly el: HTMLElement; readonly img: HTMLImageElement; readonly alt: string }
/** a dot's disc as it is painted: its middle and its radius, in px of the picker's box */
interface Round { readonly dot: Dot; readonly x: number; readonly y: number; readonly r: number }

const sleep =(ms: number): Promise<void> => new Promise((done) => { setTimeout(done, ms); });
/** resolves once the picture can be painted without a wait, or cannot be had at all */
const decoded = (img: HTMLImageElement): Promise<void> => img.decode().then(() => undefined, () => undefined);
/** the picture has arrived and can be drawn */
const here = (img: HTMLImageElement): boolean => img.complete && img.naturalWidth > 0;

/** The line's italic, two screens before the section arrives (rd-glimpse.css: the line takes its face on data-near).
 * On its own, ahead of the picker, so nothing the picker needs can keep the line from its face. */
function italic(sec: HTMLElement): void {
  const far = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    far.disconnect();
    sec.setAttribute('data-near', '');
  }, { rootMargin: '200% 0px' });
  far.observe(sec);
}

function picker(sec: HTMLElement): void {
  const one = <T extends Element = HTMLElement>(sel: string): T | null => sec.querySelector<T>(sel);
  const box = one('.rd-glimpse-box'), group = one('.rd-glimpse-dots'), stage = one('.rd-glimpse-stage'), stack = one('.rd-glimpse-pics');
  const lineEl = one('.rd-glimpse-line'), nameEl = one('.rd-glimpse-name');
  if (!box || !group || !stage || !stack || !lineEl || !nameEl) return;
  const say = one('[data-say]'), sayName = one('[data-say-name]'), sayLine = one('[data-say-line]');
  const cursor = one('.rd-glimpse-cursor');

  const dots: Dot[] = [];
  for (const el of group.querySelectorAll<HTMLElement>('.rd-glimpse-dot')) {
    const input = el.querySelector<HTMLInputElement>('.rd-glimpse-radio'), disc = el.querySelector<HTMLElement>('.rd-glimpse-disc'), id = el.dataset.shade;
    if (input && disc && id) dots.push({ el, input, disc, id, name: el.dataset.name ?? '', line: el.dataset.line ?? '' });
  }
  const pics = new Map<string, Pic>();
  for (const el of stack.querySelectorAll<HTMLElement>('.rd-glimpse-pic')) {
    const img = el.querySelector('img'), id = el.dataset.shade;
    if (img && id) pics.set(id, { el, img, alt: el.dataset.alt ?? '' });
  }
  const first = dots.find((d) => d.input.checked) ?? dots[dots.length - 1];
  if (!first || dots.some((d) => !pics.has(d.id))) return;

  /** the motion kit, while this layout's setup stands; without it every change is a cut and no demo plays */
  let K: Kit | null = null;
  /** the shade the radios say, and the shade the stage, the line and the name show (they differ while a picture loads) */
  let chosen = first.id;
  let shown = box.dataset.shade ?? chosen;
  /** the picture kept beneath the shown one: the last one seen, while the new one plays in or has not arrived */
  let under: string | null = null;
  let revealing = false;
  /** the newest change: an older one that was still waiting for its picture gives way */
  let ticket = 0;
  /** the live region's pending word, while a pointer has not yet rested on its dot */
  let saying = 0;
  let change: gsap.core.Timeline | null = null;
  let taken = false, visible = false;
  let demo: gsap.core.Timeline | null = null;

  const dotOf = (id: string): Dot | undefined => dots.find((d) => d.id === id);
  const lineSpan = (text: string): HTMLElement => { const s = document.createElement('span'); s.className = 'rd-glimpse-line-in'; s.textContent = text; return s; };
  const letter = (c: string): HTMLElement => { const s = document.createElement('span'); s.className = 'rd-glimpse-ch'; s.textContent = c; return s; };
  const setLine = (text: string): void => { lineEl.replaceChildren(lineSpan(text)); };
  const setName = (text: string): void => { nameEl.replaceChildren(...[...text].map(letter)); };
  /** a picture that was never asked for: into the layout (still unseen) and fetched now, not when it nears */
  const wake = (p: Pic): void => { p.el.hidden = false; if (p.img.loading !== 'eager') p.img.loading = 'eager'; };

  /** what the keyboard and assistive technology find: the radio and the alt on the shown picture alone, at once, and
   * the live region's two strings: at once for a key, a tap and a click, and for a pointer once it has rested `rest`
   * ms on the dot, so a pointer crossing the dots is said once, where it stops, and not at every dot on its way.
   * A string that has not changed is left alone: writing it again would have it read again */
  function mark(d: Dot, rest = 0): void {
    d.input.checked = true;
    for (const [id, p] of pics) p.img.alt = id === d.id ? p.alt : '';
    box!.dataset.shade = d.id;
    const tell = (): void => {
      if (sayName && sayName.textContent !== d.name) sayName.textContent = d.name;
      if (sayLine && sayLine.textContent !== d.line) sayLine.textContent = d.line;
    };
    clearTimeout(saying);
    if (rest > 0) saying = window.setTimeout(tell, rest);
    else tell();
  }

  /** the stage from its state: the shown picture, the one beneath it if there is one, the shown one in front */
  function paint(): void {
    for (const [id, p] of pics) {
      const on = id === shown || id === under;
      if (on) wake(p);
      p.el.toggleAttribute('data-on', on);
      p.el.toggleAttribute('data-in', id === shown && under !== null);
      if (id !== shown || !revealing) p.el.style.clipPath = '';
    }
  }

  /** the shown picture has the stage to itself once it is there to be seen; until then the last one seen stays
   * beneath it, so a slow picture never leaves the stage bare. One that cannot be had leaves its alt text alone */
  function release(): void {
    const p = pics.get(shown), id = shown;
    if (!p || under === null) return;
    if (here(p.img)) { under = null; paint(); return; }
    const arrived = (): void => { if (shown === id && !revealing && under !== null) { under = null; paint(); } };
    p.img.addEventListener('load', arrived, { once: true, passive: true });
    p.img.addEventListener('error', arrived, { once: true, passive: true });
  }

  /** a change still playing lands at once */
  function settle(): void { change?.progress(1); }

  function swap(d: Dot): void {
    settle();
    const to = pics.get(d.id), was = pics.get(shown);
    if (d.id === shown || !to) return;
    // what the eye last saw stays beneath: the shown picture, or the one under it if the shown one never arrived
    under = was && here(was.img) ? shown : under ?? shown;
    shown = d.id;
    // back to the picture still on view beneath one that never arrived: it needs no reveal, and clipping it to a
    // growing circle would leave the stage bare
    const there = under === shown;
    if (there) under = null;
    if (!K) {
      // the change with no motion
      setLine(d.line);
      setName(d.name);
      paint();
      release();
      return;
    }
    const g = K.gsap;

    // the circle, in px of the stage: from nothing at the products' centre to the stage's farthest corner
    const w = stack!.offsetWidth, h = stack!.offsetHeight, cx = w * CENTRE.x, cy = h * CENTRE.y;
    const iris = { r: 0 }, reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2;
    const draw = (): void => { to.el.style.clipPath = `circle(${iris.r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`; };
    revealing = !there;
    if (revealing) draw();
    paint();

    const oldLines = [...lineEl!.children], nextLine = lineSpan(d.line);
    lineEl!.append(nextLine);

    const land = (): void => {
      change = null;
      revealing = false;
      g.set(stack, { clearProps: 'transform' });
      setLine(d.line);
      setName(d.name);
      paint();
      release();
    };
    const tl = g.timeline({ onComplete: land });
    change = tl;
    if (revealing) tl.to(iris, { r: reach, duration: REVEAL_S, ease: 'power3.inOut', onUpdate: draw }, 0);
    tl.to(stack, { yPercent: DIP, duration: 0.22, ease: 'power2.out' }, 0)
      .to(stack, { yPercent: 0, duration: 0.6, ease: 'power3.out' }, 0.22)
      .to(oldLines, { yPercent: -110, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.04)
      .fromTo(nextLine, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.2);

    // the name, letter by letter from the left: the old letter leaves upward, the new one comes up into its place;
    // a longer name grows cells at its end, a shorter one loses them in turn
    const next = [...d.name], cells = [...nameEl!.children] as HTMLElement[], had = cells.length;
    while (cells.length < next.length) { const cell = letter(''); nameEl!.append(cell); cells.push(cell); }
    cells.forEach((cell, i) => {
      const at = NAME.at + i * NAME.step, ch = next[i];
      if (i < had) tl.to(cell, { yPercent: -45, opacity: 0, duration: 0.11, ease: 'power2.in' }, at - 0.11);
      if (ch === undefined) { tl.call(() => { cell.remove(); }, undefined, at); return; }
      tl.call(() => { cell.textContent = ch; }, undefined, at)
        .fromTo(cell, { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, at);
    });
  }

  /** every way to a shade ends here: the visitor's pointer (which gives the live region a rest, see mark), a tap, a
   * click, the arrow keys, the demo's cursor */
  function choose(id: string, rest = 0): void {
    const d = dotOf(id), p = pics.get(id);
    if (!d || !p || id === chosen) return;
    chosen = id;
    mark(d, rest);
    wake(p);
    const mine = ++ticket;
    void Promise.race([decoded(p.img), sleep(WAIT_MS)]).then(() => { if (mine === ticket) swap(d); });
  }

  // the demo

  /** where a dot's disc stands, in px of the box, by layout and so whatever its entrance is doing (the row is never transformed) */
  function discAt(d: Dot): { left: number; top: number; size: number } {
    const row = group!.getBoundingClientRect(), frame = box!.getBoundingClientRect();
    return { left: row.left - frame.left + d.el.offsetLeft, top: row.top - frame.top + d.el.offsetTop, size: d.disc.offsetWidth };
  }

  /** where the cursor's tip rests on a dot, in px of the box: on what can be seen of it */
  function tipOn(d: Dot): { x: number; y: number } {
    const c = discAt(d);
    return { x: c.left + c.size * (d === dots[dots.length - 1] ? DEMO.tip.x : DEMO.crescent), y: c.top + c.size * DEMO.tip.y };
  }

  /** the dots as they are painted, front to back: each later one over the one before, always (rd-glimpse.css) */
  function painted(): Round[] {
    return [...dots].reverse().map((dot) => {
      const c = discAt(dot);
      return { dot, x: c.left + c.size / 2, y: c.top + c.size / 2, r: c.size / 2 };
    });
  }

  /** one glide, on to the next dot or from the last back to the first. The shade changes when the tip comes over the
   * dot it is going to, as it would under the visitor's own pointer; nothing is pressed */
  function demoStep(): void {
    demo = null;
    if (!K || taken || !cursor) return;
    const g = K.gsap, at = dots.findIndex((x) => x.id === chosen), d = dots[(at + 1) % dots.length];
    if (!d) return;
    const p = tipOn(d), rounds = painted();
    let over = false;
    const arrive = (): void => { if (!over && !taken) { over = true; choose(d.id); } };
    /** the tip is over its dot once the frontmost disc under it is that dot's */
    const look = (): void => {
      if (over) return;
      const x = Number(g.getProperty(cursor, 'x')), y = Number(g.getProperty(cursor, 'y'));
      if (rounds.find((c) => Math.hypot(x - c.x, y - c.y) <= c.r)?.dot === d) arrive();
    };
    const tl = g.timeline({ onUpdate: look, onComplete: demoStep });
    tl.to(cursor, { x: p.x, duration: DEMO.glide, ease: 'power3.inOut' }, 0);
    if (at + 1 < dots.length) {
      // on to the next dot: a shallow swing on the way
      const sag = Math.max(DEMO.sag, Math.abs(p.x - Number(g.getProperty(cursor, 'x'))) * 0.12);
      tl.to(cursor, { y: p.y + sag, duration: DEMO.glide * 0.55, ease: 'sine.inOut' }, 0)
        .to(cursor, { y: p.y, duration: DEMO.glide * 0.45, ease: 'sine.out' }, DEMO.glide * 0.55);
    } else {
      // back to the first dot: down out of the last one, along under the row, and up onto the first from below
      const low = group!.getBoundingClientRect().bottom - box!.getBoundingClientRect().top + d.disc.offsetHeight * DEMO.under;
      tl.to(cursor, { y: low, duration: DEMO.glide * 0.5, ease: 'sine.inOut' }, 0)
        .to(cursor, { y: p.y, duration: DEMO.glide * (1 - DEMO.rise), ease: 'power2.inOut' }, DEMO.glide * DEMO.rise);
    }
    // the tip rests on its dot: the shade is that dot's by now, however the dots were drawn when the glide began
    tl.call(arrive, undefined, DEMO.glide)
      .call(() => undefined, undefined, DEMO.every);
    demo = tl;
    if (!visible) tl.pause();
  }

  /** the cursor comes in on the chosen dot, as the PDF's frame has it, rests, then starts its rounds */
  function demoBegin(): void {
    const d = dotOf(chosen);
    if (!K || !cursor || !d) return;
    const g = K.gsap, p = tipOn(d);
    say?.setAttribute('aria-live', 'off');
    g.set(cursor, { x: p.x + 20, y: p.y + 28, opacity: 0 });
    cursor.hidden = false;
    demo = g.timeline({ onComplete: demoStep })
      .to(cursor, { x: p.x, y: p.y, opacity: 1, duration: 0.7, ease: 'power3.out' })
      .call(() => undefined, undefined, 0.7 + DEMO.rest);
  }

  /** start it, or hold it while the box is off screen */
  function demoSync(): void {
    if (!K || taken) return;
    if (demo) demo.paused(!visible);
    else if (visible) demoBegin();
  }

  function demoStop(): void {
    demo?.kill();
    demo = null;
    if (!cursor || !K) return;
    K.gsap.killTweensOf(cursor);
    cursor.hidden = true;
    K.gsap.set(cursor, { clearProps: 'all' });
  }

  /** the visitor has reached the dots (a pointer over one, a tap, a key, focus): the cursor leaves for good */
  function takeOver(): void {
    if (taken) return;
    taken = true;
    say?.setAttribute('aria-live', 'polite');
    demo?.kill();
    demo = null;
    if (!cursor || cursor.hidden) return;
    if (!K) { cursor.hidden = true; return; }
    K.gsap.killTweensOf(cursor);
    K.gsap.to(cursor, { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => { cursor.hidden = true; } });
  }

  // a browser may give a radio back the tick it remembers: the stage follows the radios
  if (chosen !== shown) { mark(first); swap(first); }
  group.hidden = false;

  // the visitor's own pointer, a mouse or a pen held over the screen: over a dot, that dot's shade, at once and with
  // nothing pressed (Sam: "make the color change happen just with hover, no need for click"). Under such a pointer
  // only a dot's own disc takes it (rd-glimpse.css), so the event's target is the radio the pointer is seen on.
  // A finger's movement, and a pen's once it is on the glass, is the page's scroll and no hover: their tap arrives
  // below, as the radio's change
  group.addEventListener('pointermove', (e) => {
    const t = e.target;
    if (e.pointerType === 'touch' || (e.pointerType === 'pen' && e.buttons !== 0) || !(t instanceof HTMLInputElement)) return;
    takeOver();
    choose(t.value, SAY_MS);
  }, QUIET);
  // a tap, a mouse's click and the arrow keys: the radios' own change
  group.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || !t.checked) return;
    takeOver();
    choose(t.value);
  }, QUIET);
  // a press is a click: a finger that lands on a dot only to scroll the page is a pointer down and no press
  group.addEventListener('click', takeOver, QUIET);
  group.addEventListener('keydown', takeOver, QUIET);
  group.addEventListener('focusin', takeOver, QUIET);

  // the other four pictures, a screen before the section arrives
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    near.disconnect();
    for (const p of pics.values()) { wake(p); void decoded(p.img); }
  }, { rootMargin: '100% 0px' });
  near.observe(sec);

  // the demo plays only while a good part of the box is on screen (by then the dots have made their entrance)
  new IntersectionObserver((entries) => {
    for (const e of entries) visible = e.isIntersecting && e.intersectionRatio >= 0.35;
    demoSync();
  }, { threshold: [0, 0.35, 0.7] }).observe(box);

  // a new width moves the dots: the cursor starts again from the chosen one (a phone's address bar changes the height alone)
  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    if (!demo || taken) return;
    demoStop();
    demoSync();
  }, QUIET);

  onMotion((kit) => {
    K = kit;
    const discs = dots.map((d) => d.el);
    enter(kit, box, stage, { yPercent: 6, opacity: 0, duration: 1.2 }, 'top 70%');
    // the transform goes when each lands: one left on a label, even a still one, would make a stacking context of it
    // and shut the focus ring inside it, under the later discs
    enter(kit, box, discs, { scale: 0, duration: 0.55, ease: 'back.out(2.2)', stagger: 0.07, clearProps: 'transform' }, 'top 78%');
    enter(kit, box, [lineEl, nameEl], { opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.25 }, 'top 70%');
    demoSync();
    return () => {
      settle();
      demoStop();
      kit.gsap.killTweensOf(discs);
      kit.gsap.set(discs, { clearProps: 'transform' });
      K = null;
    };
  });
}

function band(el: HTMLElement): void {
  const h = el.querySelector<HTMLElement>('.rd-h');
  onMotion((kit) => {
    parallax(kit, el, 8);
    if (!h) return;
    mask(h);
    const rows = [...h.querySelectorAll<HTMLElement>('.rd-ln')];
    enter(kit, h, lines(h), { xPercent: -105, duration: 1.15, ease: 'power4.out', stagger: 0.14 });
    // the masks themselves drift, so nothing is cut off: line 1 to the right, line 2 to the left, level at mid-screen
    const reach = (): number => parseFloat(getComputedStyle(h).fontSize) * DRIFT;
    rows.forEach((row, i) => {
      const way = i % 2 ? -1 : 1;
      kit.gsap.fromTo(row, { x: () => -way * reach() }, { x: () => way * reach(), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
    });
    return () => { for (const row of rows) row.removeAttribute('data-mask'); };
  });
}

const sec = document.getElementById('glimpse');
if (sec) { italic(sec); picker(sec); }
const strip = document.querySelector<HTMLElement>('.rd-glimpse-band');
if (strip) band(strip);
