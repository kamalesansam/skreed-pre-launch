// Section 4's DOM side (docs/specs/section-4.md 2, 4 and 5). The island draws the hall, the transition and the universe
// and hands a frame here every step (window.__skreedRoomFrame); this script shows the hint and the loading line, anchors
// the prompt to the door and fades it in from 2.8 m out (in the Tab order throughout; a keyboard focus on it while it is
// off screen snaps to the station), walks on the arrow keys while the pad or a control of the section has focus (scroll
// is the one source of movement, so the keys scroll the page), turns the head on Left and Right, enters on the prompt
// (E, Enter, Space, tap), shows Skip through the transition, and in the universe keeps the products' buttons (a roving
// tabindex) and the label in step with the pan, the pointer's hover and a tap. On the poster tier, and when an asset
// fails, it swaps the two stills and shows the list, and its loop is a fade through --night to the top. Every string
// comes from config/room.ts. No library.
import { HALL, ROOM_COPY as R, ROOM_SCREENS, PAN_START, liveRoomParams, pedestalQ, type RoomFrame, type RoomIsland } from '../../config/room.ts';
import { hoverNoneMQ, reducedMQ } from '../motion.ts';
import { track } from '../quiz/track.ts';

const METRES_PER_SCREEN = (HALL.start - HALL.end) / ROOM_SCREENS.walk;   // what one screen of scrolling walks
const OVERRIDE_MS = 1500, TURN_DEG = 25, STATION_Q = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + 0.5, SLOW_MS = 8000, TAP_PX = 8, TAP_MS = 300, SETTLE_MS = 400, DRAG_DEG_PER_PX = 0.15, NO_FRAME_MS = 500;
const WIDE_MQ = matchMedia('(min-width: 900px) and (hover: hover)');
const WALK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S']);
/** a control that takes typing: the prompt never steals focus from one (spec 2, "unless an input has focus") */
const typing = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(el.type);
  return (el as HTMLElement).isContentEditable === true;
};

export function mountRoom(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  // asserted here and checked at once: the closures below keep the narrowed types
  const stage = $('rmStage')!, pad = $('rmPad')!, hint = $('rmHint')!, loading = $('rmLoading')!, enter = $<HTMLButtonElement>('rmEnter')!, skipWrap = $('rmSkipWrap')!, skip = $<HTMLButtonElement>('rmSkip')!, label = $('rmLabel')!, list = $('rmProducts')!, live = $('rmLive')!, fade = $('rmFade'), loopEnd = $('rmLoopEnd');
  if (!stage || !pad || !hint || !loading || !enter || !skipWrap || !skip || !label || !list || !live) return;
  const enterText = enter.querySelector<HTMLElement>('.rm-enter-text');
  const items = [...list.querySelectorAll<HTMLLIElement>('.rm-item')];
  const buttons = items.map((li) => li.querySelector<HTMLButtonElement>('button.rm-product')!);
  const lines = items.map((li) => li.querySelector<HTMLElement>('.rm-line'));
  const names = items.map((li) => li.querySelector<HTMLElement>('.rm-name')?.textContent ?? '');
  const H = document.documentElement;
  const keys = !hoverNoneMQ.matches;
  const isPoster = () => !H.classList.contains('hero3d') || H.classList.contains('poster') || root.dataset.tier === 'poster';
  const island = (): RoomIsland | undefined => (isPoster() ? undefined : window.__skreedRoom);
  hint.textContent = keys ? (hint.dataset.keys ?? R.hintKeys) : (hint.dataset.touch ?? R.hintTouch);
  label.textContent = keys ? (label.dataset.keys ?? R.roomHintKeys) : (label.dataset.touch ?? R.roomHintTouch);
  // on the 3D path the products are inert until the universe (room.css also keeps them hidden until this script runs);
  // without JavaScript, and on the poster tier, the list is never inert
  list.inert = !isPoster() && root.dataset.state !== 'universe';

  let viewed = false, walked = false, arrived = false, near = false, startX: number | null = null, lastQ = 0, lastFrameAt = 0, topReached = false;
  let overrideAt = 0, loadingSince = -1, busySince = -1, viaKeys = false, engaged = false, shown = -2, roving = 0, override = -1, hoverIdx = -1, lastActive = -1, settle = 0, panEnd = false, opacity = 1, catalog = -1;
  /** set around the script's own focus calls, so the focus listeners do not take them for the visitor's */
  let selfFocus = false;
  const focusQuietly = (el: HTMLElement | undefined) => { if (!el) return; selfFocus = true; try { el.focus({ preventScroll: true }); } finally { selfFocus = false; } };
  const view = () => { if (!viewed) { viewed = true; track('room_view'); } };
  // a visitor using the keyboard keeps a focus in the section when a control leaves (the pad, whose ring frames the stage);
  // anyone else just loses it, so no ring frames the screen for a pointer or a wheel
  let lastKeyAt = -1e9;
  addEventListener('keydown', () => { lastKeyAt = performance.now(); }, true);
  const keyboarding = () => performance.now() - lastKeyAt < 15000;
  const letGo = (el: Element | null) => { if (keyboarding()) focusQuietly(pad); else if (el instanceof HTMLElement) el.blur(); };

  // ---- the frame from the island
  window.__skreedRoomFrame = (f: RoomFrame) => {
    lastQ = f.q; lastFrameAt = performance.now();
    const P = liveRoomParams();
    if (f.jumped) newLap();
    if (f.inView) view();
    root.classList.toggle('rm-nochip', P.promptChip < 0.5);
    if (P.catalogWords !== catalog) { catalog = P.catalogWords; lines.forEach((l) => { if (l) l.textContent = (catalog >= 0.5 ? l.dataset.catalog : l.dataset.trim) ?? l.textContent; }); }
    // the loading line, local to the section (H1): until the hall's first frame, with the slow line at 8 s
    showLoading(f.inView && !f.ready && !f.failed);
    if (busySince >= 0 && enterText) enterText.textContent = performance.now() - busySince > SLOW_MS ? R.still : R.loadingRoom;
    if (f.state === 'hall') hallFrame(f);
    else if (f.state === 'universe') universeFrame(f, P);
    // the loop screen: the section's own DOM fades out over its first third, then the jump brings the top
    const op = f.loop > 0 ? Math.max(0, 1 - f.loop * 3) : 1;
    if (op !== opacity) { opacity = op; stage.style.opacity = op < 1 ? op.toFixed(3) : ''; }
  };

  function showLoading(on: boolean) {
    if (on && loadingSince < 0) loadingSince = performance.now();
    if (!on) loadingSince = -1;
    loading.hidden = !on;
    if (on) loading.textContent = performance.now() - loadingSince > SLOW_MS ? R.still : R.loading;
  }

  function hallFrame(f: RoomFrame) {
    if (startX === null && f.ready) startX = f.x;
    if (!walked && startX !== null && startX - f.x >= 1) { walked = true; hint.classList.add('is-gone'); hint.setAttribute('aria-hidden', 'true'); setTimeout(() => { hint.hidden = true; }, 220); }
    if (!walked) hint.hidden = !(f.ready && f.inView);
    if (!arrived && f.nearDoor >= 1) { arrived = true; track('room_walk'); }
    const isNear = f.nearDoor > 0 && f.prompt !== null && f.inView;
    if (isNear !== near) {
      near = isNear; enter.classList.toggle('is-near', isNear);
      const a = document.activeElement;
      // it takes focus as it appears, unless a text control has it; when it is clipped away again, its focus goes to the pad
      if (isNear && !typing(a) && a !== enter) focusQuietly(enter);
      else if (!isNear && a === enter) letGo(enter);
    }
    if (isNear && f.prompt) place(enter, f.prompt.x + (enter.offsetWidth || 220) * 0.5, f.prompt.y, 44);
  }

  /** a control centred at (x, y), clamped inside the gutters and above the safe area (bottom: room kept for the bottom panel) */
  function place(el: HTMLElement, x: number, y: number, bottom: number) {
    const inset = parseFloat(getComputedStyle(root).getPropertyValue('--inset')) || 16;
    const w = el.offsetWidth || 220, h = el.offsetHeight || 48;
    el.style.left = `${Math.min(Math.max(x, inset + w / 2), innerWidth - inset - w / 2)}px`;
    el.style.top = `${Math.min(Math.max(y, inset + h / 2), innerHeight - inset - h / 2 - bottom)}px`;
  }

  function universeFrame(f: RoomFrame, P: ReturnType<typeof liveRoomParams>) {
    if (!engaged && Math.abs(f.q - PAN_START) > 0.08) engaged = true;
    if (override >= 0 && (f.active === override || performance.now() - overrideAt > OVERRIDE_MS)) override = -1;   // a manual scroll after a pick wins
    const active = override >= 0 ? override : f.active;
    const float = WIDE_MQ.matches && P.labelFloat >= 0.5;
    const focused = buttons.indexOf(document.activeElement as HTMLButtonElement);
    // a focused product follows the pan, so the ring stays on the panel that shows; the hover shows only while no product has focus
    if (active >= 0 && active !== roving) setRoving(active, focused >= 0);
    const next = focused >= 0 ? roving : float && f.hover >= 0 ? f.hover : engaged ? active : -1;
    if (next !== shown) {
      shown = next;
      items.forEach((li, i) => li.classList.toggle('is-shown', i === next));
      label.hidden = next >= 0;
      if (next >= 0) track('room_product', { id: items[next].dataset.id ?? '' });
    }
    items.forEach((li, i) => {
      const a = float ? f.labels[i] : null;
      li.classList.toggle('is-float', !!a && i === next);
      if (a && i === next) { li.style.left = `${a.x}px`; li.style.top = `${a.y}px`; clampFloat(li); }
      else if (li.style.left) { li.style.left = ''; li.style.top = ''; }
    });
    // one polite announcement per scroll-driven change, once the followers settle (the focused button speaks for itself)
    if (active !== lastActive) {
      lastActive = active; clearTimeout(settle);
      settle = window.setTimeout(() => {
        const b = buttons[active];
        if (!b || document.activeElement === b || !engaged) return;
        live.textContent = `${names[active]}. ${lines[active]?.textContent ?? ''}`;
      }, SETTLE_MS);
    }
    if (!panEnd && active === items.length - 1 && engaged) { panEnd = true; track('room_pan_end'); }
  }

  function clampFloat(li: HTMLElement) {
    const inset = parseFloat(getComputedStyle(root).getPropertyValue('--inset')) || 16;
    const w = li.offsetWidth, h = li.offsetHeight, x = parseFloat(li.style.left), y = parseFloat(li.style.top);
    li.style.left = `${Math.min(Math.max(x, inset + w / 2), innerWidth - inset - w / 2)}px`;
    li.style.top = `${Math.min(Math.max(y, inset + h), innerHeight - inset)}px`;
  }

  function setRoving(i: number, focus: boolean) {
    roving = i;
    buttons.forEach((b, j) => { b.tabIndex = j === i ? 0 : -1; });
    if (focus) focusQuietly(buttons[i]);
  }

  // ---- entering
  function pressEnter() {
    if (isPoster()) { posterEnter(); return; }
    const isl = island();
    if (!isl || root.dataset.state !== 'hall' || enter.getAttribute('aria-disabled') === 'true') return;
    viaKeys = viaKeys || (document.activeElement === enter && enter.matches(':focus-visible'));
    if (!isl.enter()) {
      if (isPoster()) { posterEnter(); return; }   // the universe failed: the stills and the list stand in
      // the universe is still loading: the prompt waits (never the disabled attribute: focus stays on it) and enters by itself
      enter.setAttribute('aria-disabled', 'true'); enter.setAttribute('aria-busy', 'true');
      busySince = performance.now(); if (enterText) enterText.textContent = R.loadingRoom;
    }
  }
  const unbusy = () => { enter.removeAttribute('aria-disabled'); enter.removeAttribute('aria-busy'); busySince = -1; if (enterText) enterText.textContent = R.enter; };
  enter.addEventListener('click', pressEnter);
  // the visitor's own focus on the prompt while it is clipped (a Tab from the quiz) puts the page at the station, so the ring shows
  enter.addEventListener('focus', () => { if (!selfFocus && !near && root.dataset.state === 'hall') island()?.snap(STATION_Q); });
  enter.addEventListener('pointerenter', () => island()?.setHover(-2));
  enter.addEventListener('pointerleave', () => island()?.setHover(-1));
  skip.addEventListener('click', () => { island()?.skip(); track('room_skip'); });

  addEventListener('skreed:room-state', (e) => {
    const s = (e as CustomEvent<string>).detail;
    if (s === 'entering') {
      unbusy(); track('room_enter', { q: +lastQ.toFixed(2) });
      const hadFocus = root.contains(document.activeElement) || viaKeys;
      near = false; enter.classList.remove('is-near'); enter.hidden = true;
      hint.hidden = true; skipWrap.hidden = false;
      if (hadFocus) focusQuietly(skip);
    } else if (s === 'universe') {
      const hadFocus = root.contains(document.activeElement);
      skipWrap.hidden = true; list.inert = false; label.hidden = false; shown = -2;
      engaged = viaKeys; lastActive = -1; panEnd = false; override = -1;
      // the first product is the active one at q 10; it takes focus when the visitor came by keyboard, otherwise the pad keeps
      // the focus Skip is about to lose, and the hint stays until the first pan, tap or key
      setRoving(0, viaKeys);
      if (!viaKeys && hadFocus) letGo(document.activeElement);
    } else if (s === 'unbusy') unbusy();
    else if (s === 'jump') newLap();
  });
  addEventListener('skreed:room-universe', (e) => {
    const d = (e as CustomEvent<{ ready: boolean; failed: boolean }>).detail;
    if (!d.failed) return;
    // the universe could not load: the section falls to the stills and the list; a press that was waiting enters them now
    const waiting = busySince >= 0;
    unbusy(); root.dataset.tier = 'poster';
    if (waiting) posterEnter();
  });

  function newLap() {
    const s = root.dataset.state;
    down.clear();
    if (s === 'hall') {
      enter.hidden = false; near = false; enter.classList.remove('is-near'); unbusy();
      skipWrap.hidden = true; list.inert = true; label.hidden = true; items.forEach((li) => li.classList.remove('is-shown', 'is-float'));
      startX = null; arrived = false; shown = -2; engaged = false; override = -1; viaKeys = false;
      hoverIdx = -1; pad.classList.remove('is-over'); setRoving(0, false);
    }
    opacity = 1; stage.style.opacity = '';
    if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }

  // ---- the products: the visitor's focus, a click or a press puts the pedestal at the centre
  const pickProduct = (i: number) => {
    if (isPoster() || root.dataset.state !== 'universe') return;
    engaged = true; override = i; overrideAt = performance.now(); setRoving(i, false);
    island()?.snap(pedestalQ(i), true);
  };
  buttons.forEach((b, i) => {
    b.addEventListener('focus', () => { if (selfFocus) { roving = i; return; } pickProduct(i); });
    b.addEventListener('click', () => pickProduct(i));   // Safari and VoiceOver do not focus a button on a press
    items[i].addEventListener('pointerenter', () => { if (root.dataset.state === 'universe') island()?.setHover(i); });
    items[i].addEventListener('pointerleave', () => { if (root.dataset.state === 'universe') island()?.setHover(-1); });
  });

  // ---- keys: active only while the pad or a control of the section has focus (WCAG 2.1.4); Escape leaves (or skips)
  const down = new Set<string>(); let raf = 0, last = 0;
  const turn = (window.__skreedRoomLook ??= { yaw: 0, drag: 0 });
  const ours = (el: Element | null) => !!el && (el === pad || el === enter || el === skip || buttons.includes(el as HTMLButtonElement));
  function tick(now: number) {
    raf = 0;
    if (!ours(document.activeElement)) down.clear();   // focus left the section: nothing walks on by itself
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const P = liveRoomParams();
    let dir = 0;
    if (down.has('ArrowUp') || down.has('w') || down.has('W')) dir += 1;
    if (down.has('ArrowDown') || down.has('s') || down.has('S')) dir -= 1;
    if (dir) scrollBy({ top: dir * (P.keySpeed / METRES_PER_SCREEN) * innerHeight * dt, behavior: 'instant' });
    const inHall = root.dataset.state === 'hall';
    const want = inHall ? (down.has('ArrowRight') ? TURN_DEG : 0) - (down.has('ArrowLeft') ? TURN_DEG : 0) : 0;
    turn.yaw = reducedMQ.matches ? want : turn.yaw + (want - turn.yaw) * Math.min(1, dt * 6);
    if (down.size || Math.abs(turn.yaw) > 0.1) raf = requestAnimationFrame(tick); else turn.yaw = 0;
  }
  const ease = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Meta' || e.metaKey) down.clear();   // macOS drops the keyup of a key held under Cmd
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;   // the browser's own shortcuts pass through
    if (!ours(document.activeElement) || isPoster()) return;
    const state = root.dataset.state;
    if (e.key === 'Escape') { down.clear(); if (state === 'entering') { island()?.skip(); track('room_skip'); } else (document.activeElement as HTMLElement).blur(); return; }
    if (state === 'entering' && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== skip) { e.preventDefault(); island()?.skip(); track('room_skip'); return; }
    if ((e.key === 'e' || e.key === 'E') && state === 'hall') { e.preventDefault(); viaKeys = true; pressEnter(); return; }
    if (state === 'universe' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const to = Math.min(items.length - 1, Math.max(0, roving + (e.key === 'ArrowRight' ? 1 : -1)));
      engaged = true; override = to; overrideAt = performance.now(); setRoving(to, true);
      island()?.snap(pedestalQ(to), true);
      return;
    }
    if (!WALK_KEYS.has(e.key)) return;
    e.preventDefault();
    if (!down.has(e.key)) { down.add(e.key); ease(); }
  });
  // a release anywhere ends the key's walk: Escape, Shift+Tab or the jump can move focus while it is held
  addEventListener('keyup', (e) => { if (down.delete(e.key) && !down.size) ease(); }, true);
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget as Node | null)) down.clear(); });
  addEventListener('blur', () => { down.clear(); });

  // ---- the pointer on the pad: focus, a tap picks a pedestal (under 8 px and 300 ms, the quiz's rule), hover on laptops, the drag
  let px0 = 0, py0 = 0, pt0 = 0, dragging = false, lastX = 0;
  pad.addEventListener('pointerdown', (e) => {
    focusQuietly(pad);
    px0 = lastX = e.clientX; py0 = e.clientY; pt0 = e.timeStamp;
    dragging = e.pointerType === 'mouse' && liveRoomParams().mouseLook >= 0.5;
  });
  pad.addEventListener('pointermove', (e) => {
    if (dragging && (e.buttons & 1)) { turn.drag = Math.max(-60, Math.min(60, (turn.drag ?? 0) + (e.clientX - lastX) * DRAG_DEG_PER_PX)); lastX = e.clientX; }
    if (e.pointerType !== 'mouse' || root.dataset.state !== 'universe') return;
    const i = island()?.pick(e.clientX, e.clientY) ?? -1;
    if (i !== hoverIdx) { hoverIdx = i; island()?.setHover(i); pad.classList.toggle('is-over', i >= 0); }
  });
  pad.addEventListener('pointerleave', () => { if (hoverIdx !== -1) { hoverIdx = -1; island()?.setHover(-1); pad.classList.remove('is-over'); } });
  pad.addEventListener('pointerup', (e) => {
    dragging = false;
    if (Math.hypot(e.clientX - px0, e.clientY - py0) >= TAP_PX || e.timeStamp - pt0 >= TAP_MS) return;
    const state = root.dataset.state;
    if (state === 'entering') { island()?.skip(); track('room_skip'); return; }
    if (state !== 'universe') return;
    const i = island()?.pick(e.clientX, e.clientY) ?? -1;
    if (i >= 0) pickProduct(i);   // a miss does nothing
  });

  // ---- the section's top at the viewport's top: room_view on every tier, and the loading line while the section's own
  // chunk is still on its way (no frame has come yet)
  let waitTimer = 0;
  const watchLoading = () => {
    clearInterval(waitTimer);
    if (!topReached || isPoster()) { if (!lastFrameAt) showLoading(false); return; }
    waitTimer = window.setInterval(() => {
      if (!topReached || isPoster()) { clearInterval(waitTimer); showLoading(false); return; }
      if (performance.now() - lastFrameAt > NO_FRAME_MS) showLoading(true);
    }, 250);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      topReached = es.some((x) => x.isIntersecting);
      if (topReached && isPoster()) view();
      watchLoading();
    }, { rootMargin: '0px 0px -100% 0px' }).observe(root);
  }

  // ---- the poster tier: the stills load now (never on the 3D path or in the first view), the press swaps them and shows
  // the list; the loop is a fade through --night to the top
  function loadStills() {
    for (const pic of root.querySelectorAll<HTMLElement>('picture.rm-still[data-lazy]')) {
      for (const src of pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]')) src.srcset = src.dataset.srcset ?? '';
      const img = pic.querySelector<HTMLImageElement>('img[data-src]'); if (img) img.src = img.dataset.src ?? '';
      pic.removeAttribute('data-lazy');
    }
  }
  if (isPoster()) loadStills();
  function posterEnter() {
    root.dataset.state = 'universe'; list.inert = false;
    items.forEach((li) => li.classList.add('is-shown'));
    track('room_enter', { q: 0 });
    focusQuietly(buttons[0]);
  }
  if (loopEnd && fade && 'IntersectionObserver' in window) {
    let fading = false;
    new IntersectionObserver((es) => {
      if (!isPoster() || fading || !es.some((x) => x.isIntersecting)) return;
      fading = true; fade.hidden = false;
      const a = fade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
      a.finished.then(() => { scrollTo({ top: 0, behavior: 'instant' }); return fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished; })
        .catch(() => {}).finally(() => { fade.hidden = true; fading = false; });
    }, { threshold: 0.95 }).observe(loopEnd);
  }
  // a hard fall to the poster path while the section is on screen keeps the visitor on the still
  const mo = new MutationObserver(() => {
    if (!isPoster()) return;
    loadStills();
    const r = root.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) scrollTo({ top: Math.round(r.top + scrollY), behavior: 'instant' });
    enter.hidden = root.dataset.state === 'universe'; enter.classList.add('is-near'); unbusy(); list.inert = false;
    skipWrap.hidden = true; showLoading(false); stage.style.opacity = '';
    if (root.dataset.state === 'universe' || root.dataset.state === 'entering') posterEnter();
  });
  mo.observe(H, { attributes: true, attributeFilter: ['class'] }); mo.observe(root, { attributes: true, attributeFilter: ['data-tier'] });
  if (isPoster()) enter.classList.add('is-near');
}
