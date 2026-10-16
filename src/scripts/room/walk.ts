// Section 4's walk (docs/specs/section-4.md 2, 4 and 5): the DOM side of the entrance. The island draws the hall and
// hands a frame here every step (window.__skreedRoomFrame); this script shows and hides the hint and the loading line,
// anchors the prompt to the door and fades it in from 2.2 m out, walks on the arrow keys while the stage has focus
// (scroll is the one source of movement, so the keys scroll the page), turns the head on Left and Right, and enters on
// the prompt. Every string comes from config/room.ts. No library: the Web Animations API is not even needed here.
import { HALL, ROOM_COPY as R, ROOM_SCREENS, liveRoomParams, type RoomFrame } from '../../config/room.ts';
import { hoverNoneMQ, reducedMQ } from '../motion.ts';
import { track } from '../quiz/track.ts';

const METRES_PER_SCREEN = (HALL.start - HALL.end) / ROOM_SCREENS.walk;   // 1.245 m: what one screen of scrolling walks
const TURN_DEG = 25;

export function mountRoom(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const stage = $('rmStage'), hint = $('rmHint'), loading = $('rmLoading'), enter = $<HTMLButtonElement>('rmEnter'), skip = $<HTMLButtonElement>('rmSkip');
  if (!stage || !hint || !loading || !enter || !skip) return;
  const skipBtn = skip;   // narrowed for the closures below
  const keys = !hoverNoneMQ.matches;
  hint.textContent = keys ? (hint.dataset.keys ?? R.hintKeys) : (hint.dataset.touch ?? R.hintTouch);
  let viewed = false, walked = false, arrived = false, promptShown = false, lastQ = 0, startX: number | null = null;

  // ---- the frame from the island
  window.__skreedRoomFrame = (f: RoomFrame) => {
    lastQ = f.q;
    if (f.inView && !viewed) { viewed = true; track('room_view'); }
    loading.hidden = !(f.inView && f.q > 0 && !f.ready && !f.failed);
    if (startX === null && f.ready) startX = f.x;
    if (!walked && startX !== null && startX - f.x >= 1) { walked = true; hint.classList.add('is-gone'); hint.setAttribute('aria-hidden', 'true'); }
    if (!arrived && f.nearDoor >= 1) { arrived = true; track('room_walk'); }
    const show = f.nearDoor > 0 && f.prompt !== null && f.inView;
    if (show !== promptShown) {
      promptShown = show;
      if (show) {
        enter.hidden = false; requestAnimationFrame(() => enter.classList.add('is-shown'));
        if (!document.activeElement || document.activeElement === document.body || document.activeElement === stage) enter.focus({ preventScroll: true });
      } else { enter.classList.remove('is-shown'); enter.hidden = true; }
    }
    if (show && f.prompt) {
      // the prompt sits by the handle, clamped inside the gutters and above the safe area
      const inset = parseFloat(getComputedStyle(root).getPropertyValue('--inset')) || 16;
      const w = enter.offsetWidth || 220, h = enter.offsetHeight || 48;
      const x = Math.min(Math.max(f.prompt.x + w * 0.5, inset + w / 2), innerWidth - inset - w / 2);
      const y = Math.min(Math.max(f.prompt.y, inset + h / 2), innerHeight - inset - h / 2 - 44);
      enter.style.left = `${x}px`; enter.style.top = `${y}px`;
    }
  };

  // ---- keys: active only while the stage or the prompt has focus (WCAG 2.1.4); Escape leaves
  const down = new Set<string>(); let raf = 0, last = 0;
  const turn = { yaw: 0 }; window.__skreedRoomLook = turn;
  function tick(now: number) {
    raf = 0;
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
  const WALK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S']);
  const onKeyDown = (e: KeyboardEvent) => {
    const focused = document.activeElement === stage || document.activeElement === enter || document.activeElement === skip;
    if (!focused) return;
    if (e.key === 'Escape') { stage.blur(); return; }
    if ((e.key === 'e' || e.key === 'E') && !enter.hidden) { e.preventDefault(); enterUniverse(); return; }
    if (!WALK_KEYS.has(e.key)) return;
    e.preventDefault();
    if (!down.has(e.key)) { down.add(e.key); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  };
  const onKeyUp = (e: KeyboardEvent) => { down.delete(e.key); if (!down.size && !raf) raf = requestAnimationFrame(tick); };
  stage.addEventListener('keydown', onKeyDown); stage.addEventListener('keyup', onKeyUp);
  enter.addEventListener('keydown', onKeyDown); enter.addEventListener('keyup', onKeyUp);
  stage.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button')) return; stage.focus({ preventScroll: true }); });
  addEventListener('blur', () => { down.clear(); });

  // ---- entering (the transition arrives with the next build step; for now the state changes and the event is counted)
  function enterUniverse() {
    if (root.dataset.state !== 'hall' && root.dataset.state !== 'door') return;
    root.dataset.state = 'entering';
    track('room_enter', { q: +lastQ.toFixed(2) });
    skipBtn.hidden = false;
  }
  enter.addEventListener('click', enterUniverse);
  skipBtn.addEventListener('click', () => { track('room_skip'); skipBtn.hidden = true; });
}
