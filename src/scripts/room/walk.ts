// Section 4's DOM side (docs/specs/section-4.md 2, 4 and 5 for the hall; docs/specs/section-4-world.md 2, 3 and 5 "The
// DOM" for the rest). The island draws the hall, the bubble and the world and hands a frame here every step
// (window.__skreedRoomFrame); this script keeps the section's text in step with it, all of it plain text on the scene,
// every line decoded in and out by section 3's decode (src/scripts/quiz/decode.ts): the hall's hint and loading line;
// the prompt at the door's handle, placed by a transform from its cached size, decoded in from 2.8 m out (in the Tab
// order throughout; a keyboard focus on it while it is clipped snaps to the station) and absent with no land; Skip from
// the press to land 1 (an activation within 350 ms of its showing is dropped); each land's name, family line, catalog
// line and count on arrival, one after another, the travel hint on land 1 (its own line, never live), the Loading line
// while a travel waits (the land's status line, with the option's note); the visually hidden travel buttons; the live
// region (one announcement per arrival, only when focus does not move); and
// the keys while the pad or a control of the section has focus (WCAG 2.1.4): in the hall the walk (scroll is the one
// source of movement, so the keys scroll the page), the head's turn and E; while entering Escape, Enter and Space skip;
// in the world single presses of Down or S and Up or W travel, Escape lands at once or blurs. Every element whose wipe
// ends takes hidden, a control moving focus first and then going inert; the lands' text is clipped instead, so all N
// lands stay in the accessibility tree. On the poster tier, and when an asset fails, the hall's still stands with the
// prompt over it, a press cross-fades it to land 1 and the lands stand in a column (their pictures lazy, within one
// screen under Save-Data), and the loop is a fade through --night to the top. Every string comes from config/room.ts.
import { HALL, ROOM_COPY as R, ROOM_LANDS, ROOM_SCREENS, STATION_Q, fill, liveRoomParams, type RoomFrame, type RoomIsland } from '../../config/room.ts';
import { hoverNoneMQ, reducedMQ } from '../motion.ts';
import { createDecoder } from '../quiz/decode.ts';
import { track } from '../quiz/track.ts';

const METRES_PER_SCREEN = (HALL.start - HALL.end) / ROOM_SCREENS.walk;   // what one screen of scrolling walks
const TURN_DEG = 25, SLOW_MS = 8000, NO_FRAME_MS = 500, GUARD_MS = 350, DRAG_DEG_PER_PX = 0.15, LAND_STEP = 0.12, FADE_MS = 300;
const WALK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S']);
const FORWARD = new Set(['ArrowDown', 's', 'S']), BACK = new Set(['ArrowUp', 'w', 'W']);
const N = ROOM_LANDS.length;
/** a control that takes typing: the prompt never steals focus from one (section-4.md 2, "unless an input has focus") */
const typing = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(el.type);
  return (el as HTMLElement).isContentEditable === true;
};

export function mountRoom(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  // asserted here and checked at once: the closures below keep the narrowed types
  const stage = $('rmStage')!, pad = $('rmPad')!, hint = $('rmHint')!, loading = $('rmLoading')!, enter = $<HTMLButtonElement>('rmEnter')!, skip = $<HTMLButtonElement>('rmSkip')!, live = $('rmLive')!;
  if (!stage || !pad || !hint || !loading || !enter || !skip || !live) return;
  const list = $('rmLands'), prevB = $<HTMLButtonElement>('rmPrev'), nextB = $<HTMLButtonElement>('rmNext'), fade = $('rmFade'), loopEnd = $('rmLoopEnd');
  const enterText = enter.querySelector<HTMLElement>('.rm-enter-text')!, keyEl = enter.querySelector<HTMLElement>('.rm-key')!;
  const items = list ? [...list.querySelectorAll<HTMLLIElement>('li.rm-land')] : [];
  const lands = items.map((li) => ({
    li, name: li.querySelector<HTMLElement>('.rm-land-name')!, alt: li.querySelector<HTMLElement>('.rm-land-alt'), more: li.querySelector<HTMLElement>('.rm-land-more')!,
    hint: li.querySelector<HTMLElement>('.rm-land-hint'),
    lines: [...li.querySelectorAll<HTMLElement>('.rm-land-name, .rm-land-family, .rm-land-line, .rm-land-count')],
  }));
  const H = document.documentElement;
  const keys = !hoverNoneMQ.matches;
  const isPoster = () => !H.classList.contains('hero3d') || H.classList.contains('poster') || root.dataset.tier === 'poster';
  const island = (): RoomIsland | undefined => (isPoster() ? undefined : window.__skreedRoom);
  const dec = createDecoder(() => reducedMQ.matches);

  // every line split into its glyphs once, hidden until its part decodes in (the prompt, Skip, the hints, the lands)
  hint.textContent = keys ? (hint.dataset.keys ?? R.hintKeys) : (hint.dataset.touch ?? R.hintTouch);
  for (const el of [hint, loading, enterText, keyEl, skip]) dec.prepare(el);
  for (const l of lands) for (const el of l.lines) dec.prepare(el);
  // on the 3D path the lands are inert until the entry; without JavaScript, and on the poster tier, never
  if (list) list.inert = !isPoster() && root.dataset.state === 'hall';

  let viewed = false, walked = false, arrived = false, near = false, nearShown = false, startX: number | null = null, lastQ = 0, lastFrameAt = 0, topReached = false;
  let loadingSince = -1, busySince = -1, viaKeys = false, opacity = 1, skipAt = 0, shownLand = -1, hinted = false, travelled = false, lastSub = '', lastTravel = '', moreText = '';
  let promptW = 0, promptH = 0, inset = 16, busyText = '';
  /** set around the script's own focus calls, so the focus listeners do not take them for the visitor's */
  let selfFocus = false;
  const focusQuietly = (el: HTMLElement | null | undefined) => { if (!el) return; selfFocus = true; try { el.focus({ preventScroll: true }); } finally { selfFocus = false; } };
  const view = () => { if (!viewed) { viewed = true; track('room_view'); } };
  // a visitor using the keyboard keeps a focus in the section when a control leaves (the pad, whose ring frames the stage);
  // anyone else just loses it, so no ring frames the screen for a pointer or a wheel
  let lastKeyAt = -1e9;
  addEventListener('keydown', () => { lastKeyAt = performance.now(); }, true);
  const keyboarding = () => performance.now() - lastKeyAt < 15000;
  const letGo = (el: Element | null) => { if (keyboarding()) focusQuietly(pad); else if (el instanceof HTMLElement) el.blur(); };
  /** a control's wipe: its focus goes first (to `to`, or the pad for a keyboard user), then it is inert, wiped out and hidden */
  function wipeControl(el: HTMLElement, to?: HTMLElement | null) {
    if (el.hidden) return;
    if (el.contains(document.activeElement)) { if (to) focusQuietly(to); else letGo(document.activeElement); }
    el.inert = true;
    void dec.hide(el).then(() => { if (el.inert) el.hidden = true; });
  }
  function showControl(el: HTMLElement) { el.hidden = false; el.inert = false; void dec.show(el); }
  const measureInset = () => { inset = parseFloat(getComputedStyle(root).getPropertyValue('--inset')) || 16; };
  measureInset();
  addEventListener('resize', () => { measureInset(); promptW = 0; });

  // ---- the frame from the island
  window.__skreedRoomFrame = (f: RoomFrame) => {
    lastQ = f.q; lastFrameAt = performance.now();
    const P = liveRoomParams();
    if (f.jumped) newLap();
    if (f.inView) view();
    root.classList.toggle('rm-nochip', P.promptChip < 0.5);
    // the loading line, local to the section (H1): until the hall's first frame, with the slow line at 8 s
    showLoading(f.inView && !f.ready && !f.failed);
    if (busySince >= 0) { const t = performance.now() - busySince > SLOW_MS ? R.still : R.loadingRoom; if (busyText !== t) { busyText = t; dec.set(enterText, t); } }
    if (f.state === 'hall') hallFrame(f);
    else if (f.state === 'world') worldFrame(f);
    // the loop screen: the section's own DOM fades out over its first third, then the jump brings the top
    const op = f.loop > 0 ? Math.max(0, 1 - f.loop * 3) : 1;
    if (op !== opacity) { opacity = op; stage.style.opacity = op < 1 ? op.toFixed(3) : ''; }
  };

  function showLoading(on: boolean) {
    if (on && loadingSince < 0) { loadingSince = performance.now(); dec.set(loading, R.loading); dec.conceal(loading); loading.hidden = false; void dec.show(loading); }
    if (!on && loadingSince >= 0) { loadingSince = -1; void dec.hide(loading).then(() => { if (loadingSince < 0) loading.hidden = true; }); }
    if (on && performance.now() - loadingSince > SLOW_MS && loading.textContent?.includes(R.loading)) dec.set(loading, R.still);
  }

  function hallFrame(f: RoomFrame) {
    if (startX === null && f.ready) startX = f.x;
    if (!walked && startX !== null && startX - f.x >= 1) { walked = true; void dec.hide(hint).then(() => { hint.hidden = true; }); }
    if (!walked && f.ready && f.inView && hint.hidden) { hint.hidden = false; void dec.show(hint); }
    if (!arrived && f.nearDoor >= 1) { arrived = true; track('room_walk'); }
    const isNear = N > 0 && f.nearDoor > 0 && f.prompt !== null && f.inView;
    if (isNear !== near) {
      near = isNear;
      const a = document.activeElement;
      if (isNear) {
        enter.classList.add('is-near'); nearShown = true; promptW = 0;
        void dec.show(keyEl); void dec.show(enterText);
        // it takes focus as it appears, unless a text control has it
        if (!typing(a) && a !== enter) focusQuietly(enter);
      } else {
        // clipped away again once its wipe ends; its focus goes to the pad
        if (a === enter) letGo(enter);
        void Promise.all([dec.hide(keyEl), dec.hide(enterText)]).then(() => { if (!near) { enter.classList.remove('is-near'); nearShown = false; } });
      }
    }
    if (nearShown && f.prompt) place(f.prompt.x, f.prompt.y);
  }

  /** the prompt centred at (x, y) by a transform, from its size cached when it comes on (no layout read a frame), clamped inside the gutters */
  function place(px: number, py: number) {
    if (!promptW) { promptW = enter.offsetWidth || 260; promptH = enter.offsetHeight || 44; }
    const x = Math.min(Math.max(px + promptW * 0.5, inset + promptW / 2), innerWidth - inset - promptW / 2) - promptW / 2;
    const y = Math.min(Math.max(py, inset + promptH / 2), innerHeight - inset - promptH / 2 - 44) - promptH / 2;
    enter.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }

  // ---- the world: the land on screen, its text, the travels
  function worldFrame(f: RoomFrame) {
    const tr = f.travel ? `${f.travel.from}-${f.travel.to}` : '';
    if (f.sub === 'travel' && tr !== lastTravel) startTravel(f);
    lastTravel = tr;
    // arrival: the land's text decodes in once a travel (or the entry) has ended on it
    if (f.sub !== 'travel' && f.land !== shownLand) arrive(f.land);
    // the status line under the land's text: the Loading line while a travel waits (Still loading at 8 s) or the option's
    // note; land 1's hint, on its own line, wipes out when it comes
    const l = lands[f.land];
    if (l) {
      const want = f.sub === 'wait' ? (f.waitMs > SLOW_MS ? R.still : R.loadingLand) : f.note ? f.note : '';
      if (want && want !== moreText) { setMore(l.more, want); if (l.hint && !l.hint.hidden) setLine(l.hint, ''); }
      else if (!want && moreText) setMore(l.more, '');
    }
    lastSub = f.sub;
  }
  const hintText = () => (keys && root.contains(document.activeElement) && keyboarding() ? R.landHintKeys : R.landHintTouch);
  function setMore(el: HTMLElement, text: string) { moreText = text; setLine(el, text, () => !moreText); }
  /** a line decoded in with its text, or wiped out and hidden (when gone() still holds once the wipe ends) */
  function setLine(el: HTMLElement, text: string, gone = () => true) {
    if (!text) { void dec.hide(el).then(() => { if (gone()) el.hidden = true; }); return; }
    el.hidden = false; dec.set(el, text); dec.conceal(el); void dec.show(el);
  }

  function startTravel(f: RoomFrame) {
    const tv = f.travel!, from = lands[tv.from];
    travelled = true;
    track('room_travel', { from: ROOM_LANDS[tv.from]?.id ?? '', to: ROOM_LANDS[tv.to]?.id ?? '', option: tv.option });
    if (!from) return;
    // the land's text wipes out (0.2 s) and is clipped again; a keyboard user's focus moves to the pad
    if (root.contains(document.activeElement) && document.activeElement !== pad) letGo(document.activeElement);
    moreText = '';
    void dec.hideAll([...from.lines, from.more, ...(from.hint ? [from.hint] : [])]).then(() => { if (shownLand !== tv.from) from.li.classList.remove('is-on'); from.more.hidden = true; if (from.hint) from.hint.hidden = true; });
    shownLand = -2;
    setTravelButtons(-1);
  }

  function arrive(i: number) {
    const l = lands[i];
    if (!l) return;
    for (const o of lands) if (o !== l) o.li.classList.remove('is-on');
    shownLand = i;
    l.li.classList.add('is-on');
    for (const el of l.lines) dec.conceal(el);
    l.more.hidden = true; moreText = ''; if (l.hint) l.hint.hidden = true;
    track('room_land', { id: ROOM_LANDS[i]?.id ?? '' });
    pad.setAttribute('aria-label', R.worldAria);
    // focus: a keyboard user's on the pad (or Skip) goes to the land's name, which speaks for itself; else one polite announcement
    const a = document.activeElement, moving = a === pad || a === skip || a === prevB || a === nextB || (!!a && root.contains(a) && keyboarding());
    if (moving) focusQuietly(l.name);
    else live.textContent = fill(R.landLive, { n: i + 1, N, name: ROOM_LANDS[i].name, family: ROOM_LANDS[i].family });
    if (!skip.hidden) wipeControl(skip, l.name);
    setTravelButtons(i);
    void dec.showAll(l.lines, LAND_STEP).then(() => {
      // land 1's hint, once its text has settled, until the first travel
      if (shownLand === i && i === 0 && !travelled && !hinted && N > 1 && !moreText && l.hint) { hinted = true; setLine(l.hint, hintText()); }
    });
  }
  function setTravelButtons(i: number) {
    if (prevB) { prevB.hidden = i <= 0; }
    if (nextB) { nextB.hidden = i < 0 || i >= N - 1; }
  }

  // ---- entering
  function pressEnter() {
    if (N < 1) return;
    if (isPoster()) { posterEnter(); return; }
    const isl = island();
    if (!isl || root.dataset.state !== 'hall' || enter.getAttribute('aria-disabled') === 'true') return;
    viaKeys = viaKeys || (document.activeElement === enter && enter.matches(':focus-visible'));
    if (!isl.enter()) {
      if (isPoster()) { posterEnter(); return; }   // the world failed: the still and the column stand in
      // the world is still loading: the prompt waits (never the disabled attribute: focus stays on it) and enters by itself
      enter.setAttribute('aria-disabled', 'true'); enter.setAttribute('aria-busy', 'true');
      busySince = performance.now(); busyText = R.loadingRoom; dec.set(enterText, R.loadingRoom);
      live.textContent = R.loadingRoom;
    }
  }
  const unbusy = () => {
    enter.removeAttribute('aria-disabled'); enter.removeAttribute('aria-busy'); busySince = -1;
    if (busyText) { busyText = ''; dec.set(enterText, R.enter); }
  };
  enter.addEventListener('click', pressEnter);
  // the visitor's own focus on the prompt while it is clipped (a Tab from the quiz) puts the page at the station, so the ring shows
  enter.addEventListener('focus', () => { if (!selfFocus && !near && root.dataset.state === 'hall' && N > 0) island()?.snap(STATION_Q); });
  enter.addEventListener('pointerenter', () => island()?.setHover(-2));
  enter.addEventListener('pointerleave', () => island()?.setHover(-1));
  const doSkip = () => {
    if (performance.now() - skipAt < GUARD_MS) return;   // an activation within 350 ms of Skip appearing is dropped (DESIGN.md's guard)
    island()?.skip(); track('room_skip');
  };
  skip.addEventListener('click', doSkip);
  skip.addEventListener('keydown', (e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); });   // a held key activates once
  prevB?.addEventListener('click', () => { island()?.travel(-1); });
  nextB?.addEventListener('click', () => { island()?.travel(1); });

  addEventListener('skreed:room-state', (e) => {
    const s = (e as CustomEvent<string>).detail;
    if (s === 'entering') {
      unbusy(); track('room_enter', { q: +lastQ.toFixed(2) });
      const hadFocus = root.contains(document.activeElement) || viaKeys;
      near = false;
      skipAt = performance.now(); showControl(skip);
      wipeControl(enter, hadFocus ? skip : null);
      if (hadFocus) focusQuietly(skip);
      void dec.hide(hint).then(() => { hint.hidden = true; });
      if (list) list.inert = false;
    } else if (s === 'unbusy') unbusy();
    else if (s === 'loop') track('room_loop');
    else if (s === 'jump') newLap();
  });
  addEventListener('skreed:room-world', (e) => {
    const d = (e as CustomEvent<{ ready: boolean; failed: boolean }>).detail;
    if (!d.failed) return;
    // the world could not load: the section falls to the still and the column; a press that was waiting enters them now
    const waiting = busySince >= 0;
    unbusy(); root.dataset.tier = 'poster';
    if (waiting) posterEnter();
  });

  function newLap() {
    const s = root.dataset.state;
    down.clear();
    if (s === 'hall') {
      near = false; nearShown = false; enter.classList.remove('is-near'); unbusy();
      enter.hidden = N === 0; enter.inert = false; dec.conceal(keyEl); dec.conceal(enterText);
      skip.hidden = true; skip.inert = true; dec.conceal(skip);
      if (list) list.inert = !isPoster();
      for (const l of lands) { l.li.classList.remove('is-on'); l.more.hidden = true; if (l.hint) l.hint.hidden = true; }
      startX = null; arrived = false; walked = false; hint.hidden = true; dec.conceal(hint);
      viaKeys = false; shownLand = -1; hinted = false; travelled = false; moreText = '';
      pad.setAttribute('aria-label', R.stageAria); setTravelButtons(-1);
    }
    opacity = 1; stage.style.opacity = '';
    if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }

  // ---- keys: active only while the pad or a control of the section has focus (WCAG 2.1.4)
  const down = new Set<string>(); let raf = 0, last = 0;
  const turn = (window.__skreedRoomLook ??= { yaw: 0, drag: 0 });
  const ours = (el: Element | null) => !!el && (el === pad || el === enter || el === skip || el === prevB || el === nextB || lands.some((l) => l.name === el));
  function tick(now: number) {
    raf = 0;
    if (!ours(document.activeElement) || root.dataset.state !== 'hall') down.clear();   // focus left the section: nothing walks on by itself
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const P = liveRoomParams();
    let dir = 0;
    if (down.has('ArrowUp') || down.has('w') || down.has('W')) dir += 1;
    if (down.has('ArrowDown') || down.has('s') || down.has('S')) dir -= 1;
    if (dir) scrollBy({ top: dir * (P.keySpeed / METRES_PER_SCREEN) * innerHeight * dt, behavior: 'instant' });
    const want = (down.has('ArrowRight') ? TURN_DEG : 0) - (down.has('ArrowLeft') ? TURN_DEG : 0);
    turn.yaw = reducedMQ.matches ? want : turn.yaw + (want - turn.yaw) * Math.min(1, dt * 6);
    if (down.size || Math.abs(turn.yaw) > 0.1) raf = requestAnimationFrame(tick); else turn.yaw = 0;
  }
  const ease = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Meta' || e.metaKey) down.clear();   // macOS drops the keyup of a key held under Cmd
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;   // the browser's own shortcuts pass through
    if (!ours(document.activeElement) || isPoster()) return;
    const state = root.dataset.state, sub = root.dataset.sub;
    if (e.key === 'Escape') {
      down.clear();
      if (state === 'entering') doSkip();
      else if (state === 'world' && sub === 'travel') island()?.skip();
      else (document.activeElement as HTMLElement).blur();
      return;
    }
    if (state === 'entering') {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === pad) { e.preventDefault(); if (!e.repeat) doSkip(); }
      return;
    }
    if (state === 'world') {
      // single, non-repeating presses travel; held repeats are ignored, and the page never scrolls on them
      if (FORWARD.has(e.key) || BACK.has(e.key)) { e.preventDefault(); if (!e.repeat) island()?.travel(FORWARD.has(e.key) ? 1 : -1); }
      return;
    }
    if ((e.key === 'e' || e.key === 'E') && state === 'hall') { e.preventDefault(); if (!e.repeat) { viaKeys = true; pressEnter(); } return; }
    if (!WALK_KEYS.has(e.key)) return;
    e.preventDefault();
    if (!down.has(e.key)) { down.add(e.key); ease(); }
  });
  // a release anywhere ends the key's walk: Escape, Shift+Tab or the jump can move focus while it is held
  addEventListener('keyup', (e) => { if (down.delete(e.key) && !down.size) ease(); }, true);
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget as Node | null)) down.clear(); });
  addEventListener('blur', () => { down.clear(); });

  // ---- the pointer on the pad: focus, and the drag that turns the head in the hall (Tune's mouseLook); a tap never skips (W10)
  let dragging = false, lastX = 0;
  pad.addEventListener('pointerdown', (e) => {
    focusQuietly(pad);
    lastX = e.clientX;
    dragging = e.pointerType === 'mouse' && liveRoomParams().mouseLook >= 0.5 && root.dataset.state === 'hall';
  });
  pad.addEventListener('pointermove', (e) => {
    if (dragging && (e.buttons & 1)) { turn.drag = Math.max(-60, Math.min(60, (turn.drag ?? 0) + (e.clientX - lastX) * DRAG_DEG_PER_PX)); lastX = e.clientX; }
  });
  pad.addEventListener('pointerup', () => { dragging = false; });

  // ---- the lands' names: each speaks its alt as its description on the 3D path (the poster tier's picture carries it)
  const describe = () => { for (const l of lands) { if (isPoster()) l.name.removeAttribute('aria-describedby'); else if (l.alt) l.name.setAttribute('aria-describedby', l.alt.id); } };
  describe();

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

  // ---- the poster tier: the still loads now (never on the 3D path or in the first view), the press cross-fades it to
  // land 1 and shows the column; each land's picture loads lazily, under Save-Data only once it is within one screen; the
  // loop is a fade through --night to the top
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const swapIn = (pic: Element) => {
    if (!pic.hasAttribute('data-lazy')) return;
    for (const src of pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]')) src.srcset = src.dataset.srcset ?? '';
    const img = pic.querySelector<HTMLImageElement>('img[data-src]'); if (img) img.src = img.dataset.src ?? '';
    pic.removeAttribute('data-lazy');
  };
  let picIO: IntersectionObserver | null = null;
  function loadPosterPictures() {
    for (const pic of root.querySelectorAll('picture.rm-still[data-lazy]')) swapIn(pic);
    if (root.dataset.state !== 'world') return;
    const pics = [...root.querySelectorAll('picture.rm-land-pic[data-lazy]')];
    if (!saveData || !('IntersectionObserver' in window)) { pics.forEach(swapIn); return; }
    picIO ??= new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { picIO?.unobserve(e.target); swapIn(e.target); } }, { rootMargin: '100% 0px' });
    for (const p of pics) picIO.observe(p);
  }
  const textOf = (el: HTMLElement) => el.querySelector(':scope > .sr-only')?.textContent ?? el.textContent ?? '';
  function posterLines() {
    // the column's text stands as it is (split once, settled), its sentence case for assistive technology
    for (const l of lands) for (const el of l.lines) dec.set(el, textOf(el));
    for (const el of [keyEl, enterText]) dec.set(el, textOf(el));
  }
  if (isPoster()) { loadPosterPictures(); posterLines(); describe(); if (N > 0) enter.classList.add('is-near'); }
  function posterEnter() {
    if (N < 1 || root.dataset.state === 'world') return;
    const still = root.querySelector<HTMLElement>('picture.rm-still');
    root.dataset.state = 'world'; if (list) list.inert = false;
    for (const l of lands) l.li.classList.remove('is-on');
    posterLines(); loadPosterPictures();
    track('room_enter', { q: 0 });
    // the still cross-fades to land 1's picture under it (300 ms; a cut under reduced motion), then gives way to the column
    if (still && !reducedMQ.matches && still.animate) {
      still.style.visibility = 'visible';
      still.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' }).finished.catch(() => {}).finally(() => { still.style.visibility = ''; });
    }
    focusQuietly(lands[0]?.name);
  }
  if (loopEnd && fade && 'IntersectionObserver' in window) {
    let fading = false;
    new IntersectionObserver((es) => {
      if (!isPoster() || fading || !es.some((x) => x.isIntersecting)) return;
      fading = true; fade.hidden = false;
      const a = fade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, fill: 'forwards' });
      a.finished.then(() => { scrollTo({ top: 0, behavior: 'instant' }); track('room_loop'); return fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' }).finished; })
        .catch(() => {}).finally(() => { fade.hidden = true; fading = false; });
    }, { threshold: 0.95 }).observe(loopEnd);
  }
  // a hard fall to the poster path while the section is on screen keeps the visitor on the still, or on the column
  const mo = new MutationObserver(() => {
    if (!isPoster()) return;
    const r = root.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) scrollTo({ top: Math.round(r.top + scrollY), behavior: 'instant' });
    const s = root.dataset.state;
    enter.hidden = N === 0 || s === 'world'; enter.inert = false; enter.classList.add('is-near'); unbusy();
    skip.hidden = true; showLoading(false); stage.style.opacity = '';
    for (const l of lands) { l.li.classList.remove('is-on'); l.more.hidden = true; if (l.hint) l.hint.hidden = true; }
    posterLines(); describe(); setTravelButtons(-1);
    if (s === 'world' || s === 'entering') { root.dataset.state = 'hall'; posterEnter(); }
    else loadPosterPictures();
  });
  mo.observe(H, { attributes: true, attributeFilter: ['class'] }); mo.observe(root, { attributes: true, attributeFilter: ['data-tier'] });
}
