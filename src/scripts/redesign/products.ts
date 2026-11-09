// #products: the description panels, the phone row's place line and the section's motion (docs/specs/redesign.md
// section 6, D16 and E-RD-motion; Sam, 2026-11-09: "in the page where it's like we're not just a phone case brand,
// have the description of each product as a hover effect for each of the photo" and "add a lot of animations for the
// main head text").
//
// The panels need no motion kit: styles/rd-products.css raises a panel under the pointer and in keyboard focus by
// itself, and this file adds the press. A press on a product (its button, or its open panel) opens its description
// and keeps it open, with aria-expanded on the button; a second press closes it; a press on another product, a press
// anywhere else and Escape close it. Escape also lowers a panel that is only up because the pointer or the focus is
// on it (.rd-products-shut, until both have left), so the description can always be put away without moving either.
//
// The motion is registered with onMotion(): the headline's letters rise out of their lines' masks while the three
// lines close up with the scroll; PHONE CASE lands black and takes its sage as a slanted edge crosses it from left to
// right (a black copy of each sage word lies over it, letter for letter, and is clipped away; the clip is the
// animated value); the paragraphs come up line by line behind masks; the frames rise in a stagger and each picture
// settles from 1.15 to 1 with the scroll. Nothing is hidden before the kit arrives, whatever is already on screen
// when it does is left as it is, and once an entrance has played the section stands at rest as the PDF sets it, with
// nothing of this file left on its elements. No scroll is captured: the one scroll listener here is passive and only
// reads the row's place.
import { type Kit, chars, enter, mask, onMotion, seen } from './motion.ts';

const root = document.getElementById('products');
if (root) {
  panels(root);
  place(root);
}

/** The press: one product open at a time, its state on its button. */
function panels(sec: HTMLElement): void {
  const items = [...sec.querySelectorAll<HTMLElement>('.rd-products-item')];
  const button = (it: HTMLElement) => it.querySelector<HTMLButtonElement>('.rd-products-btn');
  const focused = (it: HTMLElement) => it.contains(document.activeElement);
  let open: HTMLElement | null = null;
  const press = (it: HTMLElement | null): void => {
    for (const o of items) button(o)?.setAttribute('aria-expanded', o === it ? 'true' : 'false');
    open = it;
  };

  for (const it of items) {
    it.addEventListener('click', (e) => {
      // a drag across the open description selects its words: that is not a press
      const sel = getSelection();
      if (sel && !sel.isCollapsed && e.target instanceof Node && it.querySelector('.rd-products-pane')?.contains(e.target)) return;
      if (open === it) { press(null); it.classList.add('rd-products-shut'); }
      else { it.classList.remove('rd-products-shut'); press(it); }
    });
    // a fresh hover or focus raises the panel again, and takes over from a product pressed open elsewhere
    it.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      it.classList.remove('rd-products-shut');
      if (open && open !== it) press(null);
    });
    it.addEventListener('focusin', () => {
      if (!button(it)?.matches(':focus-visible')) return;
      it.classList.remove('rd-products-shut');
      if (open && open !== it) press(null);
    });
    it.addEventListener('pointerleave', () => { if (!focused(it)) it.classList.remove('rd-products-shut'); });
    it.addEventListener('focusout', () => { if (!it.matches(':hover')) it.classList.remove('rd-products-shut'); });
  }

  // how far the picture rides up under an open panel: half the panel's height, so the part of the frame the panel
  // leaves shows the picture's middle. Measured whenever a panel's box changes (the faces, the width)
  const ro = new ResizeObserver((entries) => {
    for (const en of entries) {
      const it = en.target.closest<HTMLElement>('.rd-products-item');
      const frame = it?.querySelector<HTMLElement>('.rd-products-frame');
      if (!it || !frame || !(en.target instanceof HTMLElement)) continue;
      it.style.setProperty('--rd-products-lift', `${Math.round(Math.min(en.target.offsetHeight, frame.offsetHeight) / 2)}px`);
    }
  });
  for (const it of items) {
    const desc = it.querySelector('.rd-products-desc');
    if (desc) ro.observe(desc);
  }

  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (open) press(null);
    for (const it of items) if (it.matches(':hover') || focused(it)) it.classList.add('rd-products-shut');
  });
  document.addEventListener('click', (e) => {
    if (open && e.target instanceof Node && !open.contains(e.target)) press(null);
  });
}

/** The phone row's place line: its mark travels with the row's own scroll. */
function place(sec: HTMLElement): void {
  const row = sec.querySelector<HTMLElement>('.rd-products-row');
  const thumb = sec.querySelector<HTMLElement>('.rd-products-thumb');
  if (!row || !thumb) return;
  let queued = false;
  const draw = (): void => {
    queued = false;
    const span = row.scrollWidth - row.clientWidth;
    const p = span > 0 ? Math.min(1, Math.max(0, row.scrollLeft / span)) : 0;
    // the mark is a fifth of the line: four of its own widths take it from one end to the other
    thumb.style.transform = `translateX(${(p * 400).toFixed(2)}%)`;
  };
  row.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
}

// One setup alive at a time. motion.ts can start twice on a page whose scripts run before DOMContentLoaded (its
// start() is reached from both of its paths before the kit has loaded), and then every setup is run by two
// matchMedia contexts: a second entrance over the first would take the first's hidden start state for its end and
// hold the section there. The second call finds this one alive and does nothing.
let alive = false;
onMotion((kit, layout) => {
  const sec = document.getElementById('products');
  if (!sec || alive) return;
  alive = true;
  const undo: (() => void)[] = [];
  // when the headline's entrance began: the paragraphs wait their turn when one jump brings both on screen at once
  let headAt = -Infinity;
  const h2 = sec.querySelector<HTMLElement>('.rd-products-h');
  if (h2 && !seen(h2, innerHeight * 0.18)) undo.push(headline(kit, h2, () => { headAt = performance.now(); }));
  const body = sec.querySelector<HTMLElement>('.rd-products-body');
  if (body && !seen(body, innerHeight * 0.16)) undo.push(copy(kit, body, () => Math.max(0, 0.55 - (performance.now() - headAt) / 1000)));
  const row = sec.querySelector<HTMLElement>('.rd-products-row');
  if (row) frames(kit, row, layout.phone);
  return () => {
    alive = false;
    for (const u of undo) u();
  };
});

/** The headline: letters out of the masks, the sage sweep, the stack closing up with the scroll. `began` is called
 * when the entrance starts. Returns its undo. */
function headline(kit: Kit, h2: HTMLElement, began: () => void): () => void {
  const { gsap } = kit;
  const accents = [...h2.querySelectorAll<HTMLElement>('.rd-acc')];
  // the black copy over each sage word. It holds clones of the word's own letters, so each clone carries its letter's
  // number and rides with it through the rise; RdSplit's tree is already hidden from assistive technology
  const covers = accents.map((w) => {
    const c = document.createElement('span');
    c.className = 'rd-products-ink';
    for (const ch of w.querySelectorAll('.rd-c')) c.append(ch.cloneNode(true));
    w.append(c);
    return c;
  });
  mask(h2);
  const rows = [...h2.querySelectorAll<HTMLElement>('.rd-ln')];
  const letters = chars(h2);
  let live = true;
  const clear = (): void => {
    if (!live) return;
    live = false;
    for (const c of covers) c.remove();
    for (const r of rows) r.removeAttribute('data-mask');
  };

  // the sweep's edge, in px from the first sage word's left; measured when it starts, once the faces are in
  const edge = { p: 0 };
  let from = 0, to = 0, lefts: number[] = [];
  const measure = (): void => {
    const first = accents[0], last = accents[accents.length - 1];
    if (!first || !last) return;
    const em = parseFloat(getComputedStyle(h2).fontSize) || 0;
    lefts = accents.map((w) => w.offsetLeft - first.offsetLeft);
    from = -0.25 * em;
    to = last.offsetLeft - first.offsetLeft + last.offsetWidth + 0.35 * em;
  };
  const sweep = (): void => {
    const x = from + (to - from) * edge.p;
    covers.forEach((c, i) => c.style.setProperty('--rd-products-sw', `${(x - (lefts[i] ?? 0)).toFixed(1)}px`));
  };

  // the entrance, once: every letter 20 ms after the one before it, each line 90 ms after the line above; the edge
  // sets out while the second line is still landing
  const lineOf = (el: Element) => Number(el.closest<HTMLElement>('.rd-ln')?.dataset.li ?? 0);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: h2, start: 'top 82%', once: true, onEnter: began },
    onComplete: () => { gsap.set(letters, { clearProps: 'all' }); clear(); letGo(); },
  });
  tl.from(letters, {
    yPercent: 125, rotate: 6, transformOrigin: '0% 100%', duration: 1.05, ease: 'power4.out',
    stagger: (_i: number, el: Element) => Number((el as HTMLElement).dataset.i ?? 0) * 0.02 + lineOf(el) * 0.09,
  }, 0);
  tl.to(edge, { p: 1, duration: 1, ease: 'power2.inOut', onStart: measure, onUpdate: sweep }, 0.62);

  // with the scroll, while the entrance lasts: the three lines come over the foot of the screen a little apart and
  // close up to the PDF's pitch as the headline climbs it. The spread is put on while the headline is still out of
  // sight below, and the scroll lets go for good once the lines have closed or the entrance has played, whichever
  // comes first: at rest, far from the screen and in any picture of the whole page the headline stands as the PDF
  // sets it. The timeline's seconds are per cent of the screen's height: 45 on the way to the foot, 57 up to the
  // place where the lines have closed
  let held = true;
  let drift: gsap.core.Timeline | undefined;
  function letGo(): void {
    if (!held) return;
    held = false;
    drift?.scrollTrigger?.kill(false);   // false: the lines stay where they are, and ease home from there
    gsap.to(rows, { yPercent: 0, duration: 0.45, ease: 'power2.out', overwrite: true, clearProps: 'transform' });
  }
  drift = gsap.timeline({ scrollTrigger: { trigger: h2, start: 'top 140%', end: 'top 38%', scrub: 0.5, onLeave: () => letGo() } })
    .fromTo(rows, { yPercent: 0 }, { yPercent: (i: number) => i * 22, ease: 'none', duration: 45 })
    .to(rows, { yPercent: 0, ease: 'none', duration: 57 });
  return clear;
}

/** The paragraphs, line by line: each is cut into the lines it stands in at that moment, the lines rise behind their
 * own masks one after another, and the paragraph's own nodes are put back when the last has landed. `wait` gives the
 * seconds to hold back at the start. Returns its undo. */
function copy(kit: Kit, box: HTMLElement, wait: () => number): () => void {
  const { gsap, ScrollTrigger } = kit;
  const paras = [...box.querySelectorAll<HTMLElement>('p')];
  const kept = paras.map((p) => [...p.childNodes]);
  let cut = false;
  const mend = (): void => {
    if (!cut) return;
    cut = false;
    paras.forEach((p, i) => {
      p.replaceChildren(...(kept[i] ?? []));
      p.style.removeProperty('opacity');
    });
  };
  // opacity, not visibility: the words stay in the accessibility tree while they wait
  gsap.set(paras, { opacity: 0 });
  ScrollTrigger.create({
    trigger: box, start: 'top 84%', once: true,
    onEnter: () => {
      const moving: HTMLElement[] = [], waits: number[] = [], whole: HTMLElement[] = [];
      let n = 0;
      paras.forEach((p, pi) => {
        const rows = splitLines(p);
        if (!rows.length) whole.push(p);
        for (const r of rows) { moving.push(r); waits.push(pi * 0.14 + n++ * 0.07); }
      });
      cut = true;
      const delay = wait();
      gsap.set(paras, { opacity: 1 });
      if (moving.length) gsap.from(moving, { yPercent: 108, duration: 0.95, ease: 'power3.out', delay, stagger: (i: number) => waits[i] ?? 0, onComplete: mend });
      // a paragraph that could not be cut comes up whole
      if (whole.length) gsap.from(whole, { y: 28, opacity: 0, duration: 0.9, delay, stagger: 0.14 });
    },
  });
  return mend;
}

/** Cut a paragraph into the lines it wraps to now: a block per line, the line's words in an inline block inside it.
 * The words and their order are unchanged, so it reads the same while it is cut. */
function splitLines(p: HTMLElement): HTMLElement[] {
  // every text node in order (a <wbr> stands between some of them), letter by letter: a letter that sits lower than
  // the line so far opens the next line; spaces stay with the line they end
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const lines: string[] = [];
  let top = -Infinity, line = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node as Text).data;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charAt(i);
      if (!/\s/.test(ch)) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getClientRects()[0];
        if (r && r.top > top + r.height * 0.5) {
          if (line.trim()) { lines.push(line); line = ''; }
          top = r.top;
        }
      }
      line += ch;
    }
  }
  if (line.trim()) lines.push(line);
  if (!lines.length) return [];
  const out: HTMLElement[] = [];
  const frag = document.createDocumentFragment();
  for (const words of lines) {
    const row = document.createElement('span');
    row.className = 'rd-products-bl';
    const inner = document.createElement('span');
    inner.className = 'rd-products-bl-in';
    inner.textContent = words;
    row.append(inner);
    frag.append(row);
    out.push(inner);
  }
  p.replaceChildren(frag);
  return out;
}

/** The five frames rise in a stagger, once, and each picture settles into its frame with the scroll while they do:
 * 1.15 as the row comes over the foot of the screen, 1 by the time most of the row is on it. As with the headline's
 * lines, the 1.15 is put on while the row is still out of sight below, and the scroll lets go once the pictures have
 * settled or the frames have risen, so at rest every picture is in the PDF's crop. The frames move up and down only:
 * on a phone they are the row's snap targets, and one moved sideways would drag the row's own scroll after it. */
function frames(kit: Kit, row: HTMLElement, phone: boolean): void {
  const { gsap } = kit;
  const items = [...row.querySelectorAll<HTMLElement>('.rd-products-item')];
  const pics = [...row.querySelectorAll<HTMLElement>('.rd-products-pic')];
  const rise = enter(kit, row, items, { y: phone ? 48 : 72, opacity: 0, duration: 1.05, ease: 'power3.out', stagger: phone ? 0.14 : 0.09, clearProps: 'transform,opacity' }, 'top 84%');
  if (!rise) return;
  let held = true;
  let settle: gsap.core.Timeline | undefined;
  function letGo(): void {
    if (!held) return;
    held = false;
    settle?.scrollTrigger?.kill(false);   // false: the pictures stay as they are, and ease to rest from there
    gsap.to(pics, { scale: 1, duration: 0.6, ease: 'power2.out', overwrite: true, clearProps: 'transform' });
  }
  settle = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 140%', end: 'top 62%', scrub: 0.6, onLeave: () => letGo() } })
    .fromTo(pics, { scale: 1 }, { scale: 1.15, ease: 'none', duration: 45 })
    .to(pics, { scale: 1, ease: 'none', duration: 27, stagger: 1.5 });
  rise.eventCallback('onComplete', letGo);
}
