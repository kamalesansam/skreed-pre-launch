// Section 4's DOM side (docs/specs/section-4-flux.md 2, 3 and 5 "The DOM"; docs/specs/section-4-no-hall.md since
// 2026-11-02, when the hall's hint, prompt, Skip, arrow walk and drag left with the hall; the file keeps its name). The
// island draws the carousel and hands a frame here every step (window.__skreedRoomFrame); this script keeps the
// section's text in step with it, all of it plain text on the scene, every line decoded in and out by section 3's
// decode (src/scripts/quiz/decode.ts): the stage's loading line while scene 1 cannot be drawn yet; each scene's four
// lines on arrival, one after another, wiped at a step's start and when the section goes back to its approach; the
// scene hint above scene 1's count on its first visit (touch, wheel or keys by the device and the last key), gone at
// the first step and whenever the scene changes without one; the loading line under the lines while a loop is
// expected; the previous and next words bottom right, wired to the island's step ("Previous scene" aria-disabled at
// scene 1, "Next scene" at scene 5); the "Pause motion" control where E-S4-loops is declined; the live region (one
// announcement per arrival, only when focus does not move; the wrap's own line); and the pad, the stage's focusable
// group, whose focus by the visitor during the approach (a Tab from the quiz) puts the page on scene 1. The keys of the
// scenes belong to section4/scroll.ts alone. A control whose wipe ends takes hidden, its focus moving first; the
// scenes' text is clipped instead, so all five stay in the accessibility tree, inert during the approach. On the
// poster tier, and when an asset fails, the scenes stand in a column from the section's top (their stills lazy, within
// one screen under Save-Data), and the page ends at section 5 (no loop since 2026-11-03). Every string comes from
// config/room.ts.
import { ROOM_COPY as R, ROOM_SCENES, SCENE_COUNT, WORLD_START, fill, productById, shadeLine, type RoomFrame, type RoomIsland, type RoomState } from '../../config/room.ts';
import { hoverNoneMQ, reducedMQ } from '../motion.ts';
import { createDecoder } from '../quiz/decode.ts';
import { track } from '../quiz/track.ts';

const SLOW_MS = 8000, NO_FRAME_MS = 500, SCENE_STEP = 0.12;
const N = SCENE_COUNT;

export function mountRoom(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  // asserted here and checked at once: the closures below keep the narrowed types
  const stage = $('rmStage')!, pad = $('rmPad')!, loading = $('rmLoading')!, live = $('rmLive')!;
  if (!stage || !pad || !loading || !live) return;
  const list = $('rmScenes'), prevB = $<HTMLButtonElement>('rmPrev'), nextB = $<HTMLButtonElement>('rmNext'), sceneHint = $('rmSceneHint'), pause = $<HTMLButtonElement>('rmPause'), fade = $('rmFade'), loopEnd = $('rmLoopEnd');
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

  // every line split into its glyphs once, hidden until its part decodes in (the loading line, the hint, the scenes, the words)
  for (const el of [loading, ...controls, ...(sceneHint ? [sceneHint] : [])]) dec.prepare(el);
  for (const s of scenes) for (const el of s.lines) dec.prepare(el);
  // on the 3D path the scenes are inert until the arrival or the wrap; without JavaScript, and on the poster tier, never
  if (list) list.inert = !isPoster() && root.dataset.state !== 'world';

  let viewed = false, lastFrameAt = 0, topReached = false, loadingSince = -1, opacity = 1, shownScene = -1, hinted = false, stepped = false, moreText = '', moreSince = -1;
  // the state the section is in when this chunk mounts (a cold wrap lands before the chunk is in, so the first frame
  // would read as a false approach-to-seam transition and wipe the landed scene's lines and its is-on)
  let lastState: RoomState = (root.dataset.state as RoomState | undefined) ?? 'approach', navShown = false, motionOn = true;
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

  // ---- the frame from the island
  window.__skreedRoomFrame = (f: RoomFrame) => {
    lastFrameAt = performance.now();
    if (f.jumped) newLap(f.state === 'seam' ? f.under : f.state);
    if (f.inView) view();
    // the loading line, local to the section (H1): until scene 1 can be drawn, with the slow line at 8 s
    showLoading(f.inView && !f.ready && !f.failed);
    if (f.state !== lastState) { stateChanged(lastState, f.state); lastState = f.state; }
    // this chunk mounts once the section is within a screen (Room.astro), so an instant jump to scene 1 (the section index's
    // Products, the hooks' scene call, a fling that beats the import) can fire the arrival's event before it listens: a
    // scene on with nothing shown arrives now, so scene 1 never stands without its lines
    if (f.state === 'world' && !f.stepping && shownScene === -1 && f.scene >= 0) arrive(f.scene);
    if (f.state === 'world') worldFrame(f);
    // the fourth wipe (section-5.md 2): the scene's lines and the words wipe out as the cut onto section 5 begins, and
    // decode back in when the scroll returns under it
    if (f.state === 'world') outWipe(f.wipeOut > 0, f.scene);
    // the "Pause motion" control, where the director shows it (E-S4-loops declined): in the scenes and under a seam, never in the approach
    if (pause) { const want = root.dataset.pause === '1' && f.state !== 'approach'; if (want === pause.hidden) { pause.hidden = !want; pause.inert = !want; if (want) void dec.show(pause); } }
    // a seam's cover: the section's own DOM goes under the cloud with it (its lines were wiped at the seam's start)
    const op = f.cover > 0 ? Math.max(0, 1 - f.cover) : 1;
    if (op !== opacity) { opacity = op; stage.style.opacity = op < 1 ? op.toFixed(3) : ''; }
  };

  function showLoading(on: boolean) {
    if (on && loadingSince < 0) { loadingSince = performance.now(); dec.set(loading, R.loading); dec.conceal(loading); loading.hidden = false; void dec.show(loading); }
    if (!on && loadingSince >= 0) { loadingSince = -1; void dec.hide(loading).then(() => { if (loadingSince < 0) loading.hidden = true; }); }
    if (on && performance.now() - loadingSince > SLOW_MS && loading.textContent?.includes(R.loading)) dec.set(loading, R.still);
  }

  // ---- the states: the scene text and the words come and go with them
  function stateChanged(from: RoomState, to: RoomState) {
    if (to === 'seam' || (to === 'approach' && from === 'world')) {
      // a seam, or the page's own scroll back up from scene 1 (the scrollbar too): the scene's lines and the words wipe out;
      // a keyboard user's focus goes to the pad
      const sc = scenes[shownScene], was = shownScene;
      if (sc) void dec.hideAll([...sc.lines, sc.more]).then(() => { if (shownScene !== was) { sc.li.classList.remove('is-on'); sc.more.hidden = true; } });
      shownScene = -1; moreText = ''; moreSince = -1;
      if (sceneHint && !sceneHint.hidden) setLine(sceneHint, '');
      hideNav();
      const a = document.activeElement;
      if (a && a !== pad && root.contains(a)) letGo(a);
    }
    if (to === 'approach' && list) list.inert = !isPoster();
    if (to === 'world' && list) list.inert = false;
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

  /** the previous and next words: shown with the first arrival (decoded in once), "Previous scene" disabled at scene 1 and "Next scene" at scene 5 */
  function setNav(i: number) {
    const edge = (b: HTMLButtonElement | null, on: boolean) => { if (!b) return; if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); };
    edge(prevB, i <= 0); edge(nextB, i >= N - 1);
    if (!navShown) { navShown = true; for (const b of [prevB, nextB]) if (b) void dec.show(b); }
  }
  function hideNav() {
    if (!navShown) return;
    navShown = false;
    for (const b of [prevB, nextB]) if (b) void dec.hide(b);
  }

  /** the fourth wipe's start and its return: the shown scene's lines and the words wipe out, and come back once the cut has run back */
  let outWiped = false;
  function outWipe(on: boolean, i: number) {
    if (on === outWiped) return;
    outWiped = on;
    const sc = scenes[i];
    if (on) {
      if (sceneHint && !sceneHint.hidden) setLine(sceneHint, '');
      hideNav();
      if (sc && shownScene === i) void dec.hideAll([...sc.lines, sc.more]);
    } else if (sc && shownScene === i) { setNav(i); void dec.showAll(sc.lines, SCENE_STEP); }
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
    // the arrival comes before the frame that reports the state: the list leaves inert here, so focus can reach the name
    if (list) list.inert = false;
    // the scene changed without a step (the hooks, the scrollbar's re-sync, the wrap): the hint goes, as a step takes it
    if (sceneHint && !sceneHint.hidden && i !== 0) setLine(sceneHint, '');
    for (const o of scenes) if (o !== sc) o.li.classList.remove('is-on');
    shownScene = i;
    sc.li.classList.add('is-on');
    for (const el of sc.lines) dec.conceal(el);
    sc.more.hidden = true; moreText = ''; moreSince = -1;
    track('room_scene', { id: s.id, i });
    // focus: a keyboard user's on the pad or a word goes to the scene's name, which speaks for itself; else one polite
    // announcement (focus already on a scene's name moves to the new one too: a name is never focused and its line
    // announced both)
    const a = document.activeElement, moving = a === pad || a === prevB || a === nextB || (a instanceof HTMLElement && a.classList.contains('rm-scene-name')) || (!!a && root.contains(a) && keyboarding());
    // after the wrap the page stands on section 5, whose script announces the landing (section-5.md 2); the scenes wait under it
    if (!wrapped) {
      const said = fill(R.sceneLive, { n: i + 1, N, name: productById(s.product).name, shade: shadeLine(s) });
      if (moving) focusQuietly(sc.name); else live.textContent = said;
    }
    setNav(i);
    void dec.showAll(sc.lines, SCENE_STEP).then(() => {
      // the hint on scene 1's first visit, once its text has settled, until the first step
      if (shownScene === i && i === 0 && !stepped && !hinted && sceneHint) { hinted = true; setLine(sceneHint, hintText()); }
    });
  }

  // ---- the pad's keyboard focus during the approach (a Tab from the quiz): the page to scene 1, whose arrival takes the
  // focus on to its name; a focus that came before this chunk did (its focusin is what loaded it) counts the same. A click
  // or a tap on the stage focuses the pad too, but not :focus-visible, and moves nothing (D4: no control jumps the page)
  const toScenes = () => { if (!selfFocus && pad.matches(':focus-visible') && root.dataset.state === 'approach') island()?.snap(WORLD_START); };
  pad.addEventListener('focus', toScenes);
  if (document.activeElement === pad) toScenes();
  // the words: "Previous scene" at scene 1 and "Next scene" at scene 5 do nothing (aria-disabled); the page scrolls on past them
  prevB?.addEventListener('click', () => { if (prevB.getAttribute('aria-disabled') === 'true') return; island()?.step(-1); });
  nextB?.addEventListener('click', () => { if (nextB.getAttribute('aria-disabled') === 'true') return; island()?.step(1); });
  pause?.addEventListener('click', () => { motionOn = !motionOn; island()?.motion(motionOn); dec.set(pause, motionOn ? R.pause : R.play); });

  addEventListener('skreed:room-state', (e) => {
    const s = (e as CustomEvent<string>).detail;
    if (s === 'loop') track('room_loop');
    else if (s === 'wrap') {
      // the wrap landed on scene 5 under the cloud: the list leaves inert, the scene arrives with the wrap's own line
      track('room_wrap');
      arrive(N - 1, true);
    }
  });
  addEventListener('skreed:room-scene', (e) => { arrive((e as CustomEvent<{ i: number }>).detail.i); });
  addEventListener('skreed:room-step', (e) => { const d = (e as CustomEvent<{ from: number; to: number }>).detail; startStep(d.from, d.to); });

  /** the page jumped (the exit seam's cover, or the section index): the next lap's DOM, by the state the section returns to */
  function newLap(s: string | undefined = root.dataset.state) {
    if (s === 'approach') {
      for (const sc of scenes) { sc.li.classList.remove('is-on'); sc.more.hidden = true; }
      if (sceneHint) { sceneHint.hidden = true; dec.conceal(sceneHint); }
      shownScene = -1; moreText = ''; moreSince = -1;
      navShown = false; for (const b of [prevB, nextB]) if (b) dec.conceal(b);
      if (list) list.inert = !isPoster();
    }
    opacity = 1; stage.style.opacity = '';
    if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }

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

  // ---- the poster tier: the column from the section's top, each scene's still loading lazily (under Save-Data only once
  // it is within one screen; never on the 3D path or in the first view); the page ends at section 5, with no loop
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const swapIn = (pic: Element) => {
    if (!pic.hasAttribute('data-lazy')) return;
    for (const src of pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]')) src.srcset = src.dataset.srcset ?? '';
    const img = pic.querySelector<HTMLImageElement>('img[data-src]'); if (img) img.src = img.dataset.src ?? '';
    pic.removeAttribute('data-lazy');
  };
  let picIO: IntersectionObserver | null = null;
  function loadPosterPictures() {
    const pics = [...root.querySelectorAll('picture.rm-scene-pic[data-lazy]')];
    if (!saveData || !('IntersectionObserver' in window)) { pics.forEach(swapIn); return; }
    picIO ??= new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { picIO?.unobserve(e.target); swapIn(e.target); } }, { rootMargin: '100% 0px' });
    for (const p of pics) picIO.observe(p);
  }
  const textOf = (el: HTMLElement) => el.querySelector(':scope > .sr-only')?.textContent ?? el.textContent ?? '';
  function posterLines() {
    // the column's text stands as it is (split once, settled), its sentence case for assistive technology
    for (const s of scenes) for (const el of s.lines) dec.set(el, textOf(el));
  }
  if (isPoster()) { loadPosterPictures(); posterLines(); describe(); if (list) list.inert = false; }
  // no loop from the section's end on any tier since 2026-11-03 (section-5-picture.md 18): the page ends at section 5
  // a hard fall to the poster path while the section is on screen keeps the visitor at the column's top
  const mo = new MutationObserver(() => {
    if (!isPoster()) return;
    const r = root.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) scrollTo({ top: Math.round(r.top + scrollY), behavior: 'instant' });
    showLoading(false); stage.style.opacity = '';
    for (const sc of scenes) { sc.li.classList.remove('is-on'); sc.more.hidden = true; }
    if (sceneHint) sceneHint.hidden = true;
    if (list) list.inert = false;
    posterLines(); describe(); loadPosterPictures();
  });
  mo.observe(H, { attributes: true, attributeFilter: ['class'] }); mo.observe(root, { attributes: true, attributeFilter: ['data-tier'] });
}
