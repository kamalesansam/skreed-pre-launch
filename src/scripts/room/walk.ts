// Section 4's DOM side (docs/specs/section-4.md 2, 4 and 5 for the hall; docs/specs/section-4-flux.md 2, 3 and 5 "The
// DOM" for the scenes). The island draws the hall, the bubble and the carousel and hands a frame here every step
// (window.__skreedRoomFrame); this script keeps the section's text in step with it, all of it plain text on the scene,
// every line decoded in and out by section 3's decode (src/scripts/quiz/decode.ts): the hall's hint and loading line;
// the prompt at the door's handle, placed by a transform from its cached size, decoded in from 2.8 m out (in the Tab
// order throughout; a keyboard focus on it while it is clipped snaps to the station); Skip from the press to scene 1
// (an activation within 350 ms of its showing is dropped); each scene's four lines on arrival, one after another, wiped
// at a step's start; the scene hint above scene 1's count on its first visit (touch, wheel or keys by the device and the
// last key), gone at the first step and whenever the scene changes without one; the
// loading line under the lines while a loop is expected; the previous and next words bottom right, wired to the
// island's step and the way back; the "Pause motion" control where E-S4-loops is declined; the live region (one
// announcement per arrival, only when focus does not move; the wrap's own line); and the keys while the pad or a control
// of the section has focus (WCAG 2.1.4): in the hall the walk (scroll is the one source of movement, so the keys scroll
// the page, clamped at the station), the head's turn and E; while entering Escape, Enter and Space skip. The keys of
// the scenes belong to section4/scroll.ts alone. Every element whose wipe ends takes hidden, a control moving focus
// first and then going inert; the scenes' text is clipped instead, so all five stay in the accessibility tree, inert
// until the entry or the wrap. On the poster tier, and when an asset fails, the hall's still stands with the prompt
// over it, a press cross-fades it to scene 1's still and the scenes stand in a column (their stills lazy, within one
// screen under Save-Data), and the loop is a fade through --night to the top. Every string comes from config/room.ts.
import { HALL, ROOM_COPY as R, ROOM_SCENES, ROOM_SCREENS, SCENE_COUNT, STATION_Q, fill, liveRoomParams, productById, shadeLine, type RoomFrame, type RoomIsland, type RoomState } from '../../config/room.ts';
import { hoverNoneMQ, reducedMQ } from '../motion.ts';
import { createDecoder } from '../quiz/decode.ts';
import { track } from '../quiz/track.ts';

const METRES_PER_SCREEN = (HALL.start - HALL.end) / ROOM_SCREENS.walk;   // what one screen of scrolling walks
const TURN_DEG = 25, SLOW_MS = 8000, NO_FRAME_MS = 500, GUARD_MS = 350, DRAG_DEG_PER_PX = 0.15, SCENE_STEP = 0.12, FADE_MS = 300;
const WALK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S']);
const N = SCENE_COUNT;
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
  const list = $('rmScenes'), prevB = $<HTMLButtonElement>('rmPrev'), nextB = $<HTMLButtonElement>('rmNext'), sceneHint = $('rmSceneHint'), pause = $<HTMLButtonElement>('rmPause'), fade = $('rmFade'), loopEnd = $('rmLoopEnd');
  const enterText = enter.querySelector<HTMLElement>('.rm-enter-text')!, keyEl = enter.querySelector<HTMLElement>('.rm-key')!;
  const items = list ? [...list.querySelectorAll<HTMLLIElement>('li.rm-scene')] : [];
  const scenes = items.map((li) => ({
    li, name: li.querySelector<HTMLElement>('.rm-scene-name')!, alt: li.querySelector<HTMLElement>('.rm-scene-alt'), more: li.querySelector<HTMLElement>('.rm-scene-more')!,
    lines: [...li.querySelectorAll<HTMLElement>('.rm-scene-name, .rm-scene-shade, .rm-scene-line, .rm-scene-count')],
  }));
  const H = document.documentElement;
  const keys = !hoverNoneMQ.matches;
  const isPoster = () => !H.classList.contains('hero3d') || H.classList.contains('poster') || root.dataset.tier === 'poster';
  const island = (): RoomIsland | undefined => (isPoster() ? undefined : window.__skreedRoom);
  const dec = createDecoder(() => reducedMQ.matches);
  const controls = [prevB, nextB, pause].filter((b): b is HTMLButtonElement => !!b);

  // every line split into its glyphs once, hidden until its part decodes in (the prompt, Skip, the hints, the scenes, the words)
  hint.textContent = keys ? (hint.dataset.keys ?? R.hintKeys) : (hint.dataset.touch ?? R.hintTouch);
  for (const el of [hint, loading, enterText, keyEl, skip, ...controls, ...(sceneHint ? [sceneHint] : [])]) dec.prepare(el);
  for (const s of scenes) for (const el of s.lines) dec.prepare(el);
  // on the 3D path the scenes are inert until the entry or the wrap; without JavaScript, and on the poster tier, never
  if (list) list.inert = !isPoster() && root.dataset.state === 'hall';

  let viewed = false, walked = false, arrived = false, near = false, nearShown = false, startX: number | null = null, lastQ = 0, lastQRaw = 0, lastFrameAt = 0, topReached = false;
  let loadingSince = -1, busySince = -1, viaKeys = false, opacity = 1, skipAt = 0, shownScene = -1, hinted = false, stepped = false, moreText = '', moreSince = -1;
  // the state the section is in when this chunk mounts (a cold wrap lands before the chunk is in, so the first frame
  // would read as a false hall-to-seam transition and wipe the landed scene's lines and its is-on)
  let promptW = 0, promptH = 0, inset = 16, busyText = '', lastState: RoomState = (root.dataset.state as RoomState | undefined) ?? 'hall', navShown = false, motionOn = true;
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
  /**
   * The prompt's wipe at the entry: its focus goes first (to `to`, or the pad for a keyboard user), then it is inert and
   * its two spans wipe out, then it is hidden. Never the button itself through the decode: the button is no prepared
   * line, so a hide of it would split its whole text afresh (the two spans' copies run together, "[E][E]Enter...")
   * and detach the spans the way back restores (the build record's D2).
   */
  function wipePrompt(to?: HTMLElement | null) {
    if (enter.hidden) return;
    if (enter.contains(document.activeElement)) { if (to) focusQuietly(to); else letGo(document.activeElement); }
    enter.inert = true;
    void Promise.all([dec.hide(keyEl), dec.hide(enterText)]).then(() => { if (enter.inert) enter.hidden = true; });
  }
  /**
   * The prompt back in the hall (the way back, the reset from the scrollbar, an entry abandoned off screen, the new lap):
   * in the Tab order again and clipped until the station frame decodes it in, its busy text gone, the scenes inert again.
   */
  function restorePrompt() {
    near = false; nearShown = false; enter.classList.remove('is-near'); unbusy();
    enter.hidden = false; enter.inert = false; dec.conceal(keyEl); dec.conceal(enterText);
    if (list) list.inert = !isPoster();
  }
  /** the prompt gone while the scenes stand (the wrap's landing): never a hidden stop in the Tab order inside the scenes */
  function hidePrompt() {
    if (enter.hidden) return;
    if (enter.contains(document.activeElement)) letGo(document.activeElement);
    near = false; nearShown = false; enter.classList.remove('is-near');
    enter.inert = true; enter.hidden = true; dec.conceal(keyEl); dec.conceal(enterText);
  }
  const measureInset = () => { inset = parseFloat(getComputedStyle(root).getPropertyValue('--inset')) || 16; };
  measureInset();
  addEventListener('resize', () => { measureInset(); promptW = 0; });

  // ---- the frame from the island
  window.__skreedRoomFrame = (f: RoomFrame) => {
    lastQ = f.q; lastQRaw = f.qRaw; lastFrameAt = performance.now();
    const P = liveRoomParams();
    if (f.jumped) newLap(f.state === 'seam' ? f.under : f.state);
    if (f.inView) view();
    root.classList.toggle('rm-nochip', P.promptChip < 0.5);
    // the loading line, local to the section (H1): until the hall's first frame, with the slow line at 8 s
    showLoading(f.inView && !f.ready && !f.failed);
    if (busySince >= 0) { const t = performance.now() - busySince > SLOW_MS ? R.still : R.loadingRoom; if (busyText !== t) { busyText = t; dec.set(enterText, t); } }
    if (f.state !== lastState) { stateChanged(lastState, f.state); lastState = f.state; }
    if (f.state === 'hall') hallFrame(f);
    else if (f.state === 'world') worldFrame(f);
    // the "Pause motion" control, where the director shows it (E-S4-loops declined): from the press, never in the hall
    if (pause) { const want = root.dataset.pause === '1' && f.state !== 'hall'; if (want === pause.hidden) { pause.hidden = !want; pause.inert = !want; if (want) void dec.show(pause); } }
    // a seam's cover: the section's own DOM goes under the cloud with it (its lines were wiped at the seam's start)
    const op = f.cover > 0 ? Math.max(0, 1 - f.cover) : 1;
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
    const isNear = f.nearDoor > 0 && f.prompt !== null && f.inView;
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

  // ---- the states: the scene text and the words come and go with them
  function stateChanged(from: RoomState, to: RoomState) {
    if (to === 'back' || to === 'seam' || (to === 'hall' && from === 'world')) {
      // the way back, a seam, or the reset from the scrollbar: the scene's lines and the words wipe out; a keyboard user's focus goes to the pad
      const sc = scenes[shownScene], was = shownScene;
      if (sc) void dec.hideAll([...sc.lines, sc.more]).then(() => { if (shownScene !== was) { sc.li.classList.remove('is-on'); sc.more.hidden = true; } });
      shownScene = -1; moreText = ''; moreSince = -1;
      if (sceneHint && !sceneHint.hidden) setLine(sceneHint, '');
      hideNav();
      const a = document.activeElement;
      if (a && a !== pad && root.contains(a) && a !== enter) letGo(a);
    }
    // the hall again from anywhere (the way back's end, the reset, an abandoned entry, the exit's lock ending): the prompt
    // back in the Tab order for the station frame to show, Skip gone
    if (to === 'hall' && from !== 'hall') { restorePrompt(); if (!skip.hidden) wipeControl(skip, null); }
    if (to === 'hall') pad.setAttribute('aria-label', R.stageAria);
    if (to === 'world') { pad.setAttribute('aria-label', R.worldAria); if (list) list.inert = false; }
  }
  function worldFrame(f: RoomFrame) {
    // the loading line under the scene's lines while its loop is expected (Still loading at 8 s), or the refusal's note on a Tune build
    const sc = scenes[f.scene];
    if (sc && !f.stepping) {
      const want = f.loading ? (moreSince >= 0 && performance.now() - moreSince > SLOW_MS ? R.still : R.loadingScene) : f.note ? R.clipBlocked : '';
      if (want && !moreText) moreSince = performance.now();
      if (want !== moreText) setMore(sc.more, want);
    }
  }
  const hintText = () => (!keys ? R.sceneHintTouch : keyboarding() ? R.sceneHintKeys : R.sceneHintWheel);
  function setMore(el: HTMLElement, text: string) { moreText = text; if (!text) moreSince = -1; setLine(el, text, () => !moreText); }
  /** a line decoded in with its text, or wiped out and hidden (when gone() still holds once the wipe ends) */
  function setLine(el: HTMLElement, text: string, gone = () => true) {
    if (!text) { void dec.hide(el).then(() => { if (gone()) el.hidden = true; }); return; }
    el.hidden = false; dec.set(el, text); dec.conceal(el); void dec.show(el);
  }

  /** the previous and next words: shown with the first arrival (decoded in once), "Next scene" disabled at scene 5 */
  function setNav(i: number) {
    if (nextB) { if (i >= N - 1) nextB.setAttribute('aria-disabled', 'true'); else nextB.removeAttribute('aria-disabled'); }
    if (!navShown) { navShown = true; for (const b of [prevB, nextB]) if (b) void dec.show(b); }
  }
  function hideNav() {
    if (!navShown) return;
    navShown = false;
    for (const b of [prevB, nextB]) if (b) void dec.hide(b);
  }

  /** a step's start: the scene's lines wipe out (0.2 s) and are clipped again, the hint goes for good */
  function startStep(from: number, to: number) {
    const sc = scenes[from];
    stepped = true;
    track('room_step', { from: ROOM_SCENES[from]?.id ?? '', to: ROOM_SCENES[to]?.id ?? '' });
    if (sceneHint && !sceneHint.hidden) setLine(sceneHint, '');
    if (!sc) return;
    moreText = ''; moreSince = -1;
    void dec.hideAll([...sc.lines, sc.more]).then(() => { if (shownScene !== from) sc.li.classList.remove('is-on'); sc.more.hidden = true; });
    shownScene = -2;
  }

  /** arrival at scene i: its four lines decode in one after another; focus or one announcement (the wrap's own line after the wrap) */
  function arrive(i: number, wrapped = false) {
    const sc = scenes[i], s = ROOM_SCENES[i];
    if (!sc || !s) return;
    // the scene changed without a step (the hooks, the scrollbar's re-sync, the wrap): the hint goes, as a step takes it
    if (sceneHint && !sceneHint.hidden && i !== 0) setLine(sceneHint, '');
    for (const o of scenes) if (o !== sc) o.li.classList.remove('is-on');
    shownScene = i;
    sc.li.classList.add('is-on');
    for (const el of sc.lines) dec.conceal(el);
    sc.more.hidden = true; moreText = ''; moreSince = -1;
    track('room_scene', { id: s.id, i });
    pad.setAttribute('aria-label', R.worldAria);
    // focus: a keyboard user's on the pad, Skip or a word goes to the scene's name, which speaks for itself; else one polite announcement
    // (focus already on a scene's name moves to the new one too: the hook's entry arrives twice at scene 1, Skip first and
    // then the name, and a name must never be focused and its line announced both)
    const a = document.activeElement, moving = a === pad || a === skip || a === prevB || a === nextB || (a instanceof HTMLElement && a.classList.contains('rm-scene-name')) || (!!a && root.contains(a) && keyboarding());
    const said = fill(wrapped ? R.wrapLive : R.sceneLive, { n: i + 1, N, name: productById(s.product).name, shade: shadeLine(s) });
    if (moving) focusQuietly(sc.name); else live.textContent = said;
    if (!skip.hidden) wipeControl(skip, sc.name);
    setNav(i);
    void dec.showAll(sc.lines, SCENE_STEP).then(() => {
      // the hint on scene 1's first visit, once its text has settled, until the first step
      if (shownScene === i && i === 0 && !stepped && !hinted && sceneHint) { hinted = true; setLine(sceneHint, hintText()); }
    });
  }

  // ---- entering
  function pressEnter() {
    if (isPoster()) { posterEnter(); return; }
    const isl = island();
    if (!isl || root.dataset.state !== 'hall' || enter.getAttribute('aria-disabled') === 'true') return;
    viaKeys = viaKeys || (document.activeElement === enter && enter.matches(':focus-visible'));
    if (!isl.enter()) {
      if (isPoster()) { posterEnter(); return; }   // the section fell to the poster tier: the still and the column stand in
      // the scenes are still loading: the prompt waits (never the disabled attribute: focus stays on it) and enters by itself
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
  enter.addEventListener('focus', () => { if (!selfFocus && !near && root.dataset.state === 'hall') island()?.snap(STATION_Q); });
  enter.addEventListener('pointerenter', () => island()?.setHover(-2));
  enter.addEventListener('pointerleave', () => island()?.setHover(-1));
  const doSkip = () => {
    if (performance.now() - skipAt < GUARD_MS) return;   // an activation within 350 ms of Skip appearing is dropped (DESIGN.md's guard)
    island()?.skip(); track('room_skip');
  };
  skip.addEventListener('click', doSkip);
  skip.addEventListener('keydown', (e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); });   // a held key activates once
  // the words: "Previous scene" at scene 1 is the way back, "Next scene" at scene 5 does nothing (aria-disabled)
  prevB?.addEventListener('click', () => { const isl = island(); if (!isl) return; if (shownScene === 0) isl.back(); else isl.step(-1); });
  nextB?.addEventListener('click', () => { if (nextB.getAttribute('aria-disabled') === 'true') return; island()?.step(1); });
  pause?.addEventListener('click', () => { motionOn = !motionOn; island()?.motion(motionOn); dec.set(pause, motionOn ? R.pause : R.play); });

  addEventListener('skreed:room-state', (e) => {
    const s = (e as CustomEvent<string>).detail;
    if (s === 'entering') {
      unbusy(); track('room_enter', { q: +lastQ.toFixed(2) });
      const hadFocus = root.contains(document.activeElement) || viaKeys;
      near = false;
      skipAt = performance.now(); showControl(skip);
      wipePrompt(hadFocus ? skip : null);
      if (hadFocus) focusQuietly(skip);
      void dec.hide(hint).then(() => { hint.hidden = true; });
      if (list) list.inert = false;
    } else if (s === 'unbusy') unbusy();
    else if (s === 'loop') track('room_loop');
    else if (s === 'back') {
      // the way back ended (or the reset from the scrollbar): the hall at the station, the prompt back for its frame to
      // show (the entry had wiped it), a keyboard user's focus on it
      track('room_back');
      restorePrompt();
      if (!skip.hidden) wipeControl(skip, null);
      if (keyboarding() || viaKeys) focusQuietly(enter);
    } else if (s === 'wrap') {
      // the wrap landed on scene 5 under the cloud: the prompt goes (the new lap had put it back), the list leaves inert,
      // the scene arrives with the wrap's own line
      track('room_wrap');
      hidePrompt();
      if (list) list.inert = false;
      arrive(N - 1, true);
    }
  });
  addEventListener('skreed:room-scene', (e) => { arrive((e as CustomEvent<{ i: number }>).detail.i); });
  addEventListener('skreed:room-step', (e) => { const d = (e as CustomEvent<{ from: number; to: number }>).detail; startStep(d.from, d.to); });

  /** the page jumped to the top (the exit seam's cover, or the back-to-top control): the next lap's DOM, by the state the section returns to */
  function newLap(s: string | undefined = root.dataset.state) {
    down.clear();
    if (s === 'hall') {
      restorePrompt();
      skip.hidden = true; skip.inert = true; dec.conceal(skip);
      for (const sc of scenes) { sc.li.classList.remove('is-on'); sc.more.hidden = true; }
      if (sceneHint) { sceneHint.hidden = true; dec.conceal(sceneHint); }
      startX = null; arrived = false; walked = false; hint.hidden = true; dec.conceal(hint);
      viaKeys = false; shownScene = -1; moreText = ''; moreSince = -1;
      pad.setAttribute('aria-label', R.stageAria);
      navShown = false; for (const b of [prevB, nextB]) if (b) dec.conceal(b);
    }
    opacity = 1; stage.style.opacity = '';
    if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }

  // ---- keys: active only while the pad or a control of the section has focus (WCAG 2.1.4); in the scenes the keys are scroll.ts's
  const down = new Set<string>(); let raf = 0, last = 0;
  const turn = (window.__skreedRoomLook ??= { yaw: 0, drag: 0 });
  const ours = (el: Element | null) => !!el && (el === pad || el === enter || el === skip || controls.includes(el as HTMLButtonElement) || scenes.some((s) => s.name === el));
  function tick(now: number) {
    raf = 0;
    if (!ours(document.activeElement) || root.dataset.state !== 'hall') down.clear();   // focus left the section: nothing walks on by itself
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const P = liveRoomParams();
    let dir = 0;
    if (down.has('ArrowUp') || down.has('w') || down.has('W')) dir += 1;
    if (down.has('ArrowDown') || down.has('s') || down.has('S')) dir -= 1;
    if (dir > 0 && lastQRaw >= STATION_Q) dir = 0;   // the pad's walk ends at the station: it never carries the page into the scenes' range
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
    const state = root.dataset.state;
    if (e.key === 'Escape') {
      down.clear();
      if (state === 'entering') doSkip();
      else (document.activeElement as HTMLElement).blur();
      return;
    }
    if (state === 'entering') {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === pad) { e.preventDefault(); if (!e.repeat) doSkip(); }
      return;
    }
    if (state !== 'hall') return;   // the scenes' keys are scroll.ts's (one step per keydown); a seam's and the way back's are swallowed there too
    if (e.key === 'e' || e.key === 'E') { e.preventDefault(); if (!e.repeat) { viaKeys = true; pressEnter(); } return; }
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

  // ---- the scenes' names: each speaks its room's alt as its description on the 3D path (the poster tier's still carries it)
  const describe = () => { for (const s of scenes) { if (isPoster()) s.name.removeAttribute('aria-describedby'); else if (s.alt) s.name.setAttribute('aria-describedby', s.alt.id); } };
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
  // scene 1 and shows the column; each scene's still loads lazily, under Save-Data only once it is within one screen; the
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
    const pics = [...root.querySelectorAll('picture.rm-scene-pic[data-lazy]')];
    if (!saveData || !('IntersectionObserver' in window)) { pics.forEach(swapIn); return; }
    picIO ??= new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { picIO?.unobserve(e.target); swapIn(e.target); } }, { rootMargin: '100% 0px' });
    for (const p of pics) picIO.observe(p);
  }
  const textOf = (el: HTMLElement) => el.querySelector(':scope > .sr-only')?.textContent ?? el.textContent ?? '';
  function posterLines() {
    // the column's text stands as it is (split once, settled), its sentence case for assistive technology
    for (const s of scenes) for (const el of s.lines) dec.set(el, textOf(el));
    for (const el of [keyEl, enterText]) dec.set(el, textOf(el));
  }
  if (isPoster()) { loadPosterPictures(); posterLines(); describe(); enter.classList.add('is-near'); }
  function posterEnter() {
    if (root.dataset.state === 'world') return;
    const still = root.querySelector<HTMLElement>('picture.rm-still');
    root.dataset.state = 'world'; if (list) list.inert = false;
    for (const s of scenes) s.li.classList.remove('is-on');
    posterLines(); loadPosterPictures();
    track('room_enter', { q: 0 });
    // the still cross-fades to scene 1's still under it (300 ms; a cut under reduced motion), then gives way to the column
    if (still && !reducedMQ.matches && still.animate) {
      still.style.visibility = 'visible';
      still.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' }).finished.catch(() => {}).finally(() => { still.style.visibility = ''; });
    }
    focusQuietly(scenes[0]?.name);
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
    enter.hidden = s === 'world'; enter.inert = false; enter.classList.add('is-near'); unbusy();
    skip.hidden = true; showLoading(false); stage.style.opacity = '';
    for (const sc of scenes) { sc.li.classList.remove('is-on'); sc.more.hidden = true; }
    if (sceneHint) sceneHint.hidden = true;
    posterLines(); describe();
    if (s === 'world' || s === 'entering' || s === 'back' || s === 'seam') { root.dataset.state = 'hall'; posterEnter(); }
    else loadPosterPictures();
  });
  mo.observe(H, { attributes: true, attributeFilter: ['class'] }); mo.observe(root, { attributes: true, attributeFilter: ['data-tier'] });
}
