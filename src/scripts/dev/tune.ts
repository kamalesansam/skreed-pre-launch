// Tune (dev and staging only; hero-architecture.md 10): the prototype's slider loop and buttons (template.html lines 303
// to 311 and 1052 to 1071) over a mutable dev copy of HERO_PARAMS. Every lookup is null-guarded. The island subscribes
// through window.__skreedTune (build step 6) so Sam can tune on staging and hand the numbers back for params.ts.
import { HERO_PARAMS, heroParams, type HeroParamKey, type HeroParams } from '../../config/params.ts';
import { ROOM_PARAMS, roomParams, type RoomParamKey, type RoomParams } from '../../config/room.ts';
import { FOG_HUE_PARAMS, fogHueParams, type FogHueParamKey } from '../../config/fog-hues.ts';
import { sceneReduced } from '../motion.ts';

type Listener = (p: HeroParams, key: HeroParamKey | null) => void;
type RoomListener = (p: RoomParams, key: RoomParamKey | null) => void;
const params = heroParams(sceneReduced());
const listeners = new Set<Listener>();
const emit = (key: HeroParamKey | null) => listeners.forEach((fn) => fn(params, key));
// section 4's parameters (config/room.ts): the island reads the live copy every frame through liveRoomParams()
const room = roomParams();
const roomListeners = new Set<RoomListener>();
const emitRoom = (key: RoomParamKey | null) => roomListeners.forEach((fn) => fn(room, key));
// the fog's shade hues (config/fog-hues.ts): section2/hues.ts reads the live copy every frame through liveFogHues()
const fog = fogHueParams();
(window as unknown as { __skreedTune: unknown }).__skreedTune = {
  params,
  subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); },
  room: { params: room, subscribe(fn: RoomListener) { roomListeners.add(fn); return () => roomListeners.delete(fn); } },
  fog: { params: fog },
};

const $ = (id: string) => document.getElementById(id);
const panel = $('tune');
if (panel instanceof HTMLDetailsElement) { panel.hidden = false; panel.open = true; }

const keys = Object.keys(HERO_PARAMS) as HeroParamKey[];
const show = (k: HeroParamKey) => { const el = $(k), o = $('o-' + k); if (el instanceof HTMLInputElement) el.value = String(params[k]); if (o) o.textContent = params[k].toFixed(2); };
for (const k of keys) {
  const el = $(k);
  if (!(el instanceof HTMLInputElement)) continue;
  show(k);
  el.addEventListener('input', () => { params[k] = +el.value; const o = $('o-' + k); if (o) o.textContent = (+el.value).toFixed(2); onParam(k); emit(k); });
}

const roomKeys = Object.keys(ROOM_PARAMS) as RoomParamKey[];
const showRoom = (k: RoomParamKey) => { const el = $('r-' + k), o = $('o-r-' + k); if (el instanceof HTMLInputElement) el.value = String(room[k]); if (o) o.textContent = Number.isInteger(room[k]) ? String(room[k]) : room[k].toFixed(2); };
for (const k of roomKeys) {
  const el = $('r-' + k);
  if (!(el instanceof HTMLInputElement)) continue;
  showRoom(k);
  el.addEventListener('input', () => { room[k] = +el.value; showRoom(k); emitRoom(k); });
}

const fogKeys = Object.keys(FOG_HUE_PARAMS) as FogHueParamKey[];
const showFog = (k: FogHueParamKey) => { const el = $('f-' + k), o = $('o-f-' + k); if (el instanceof HTMLInputElement) el.value = String(fog[k]); if (o) o.textContent = Number.isInteger(fog[k]) ? String(fog[k]) : fog[k].toFixed(2); };
for (const k of fogKeys) {
  const el = $('f-' + k);
  if (!(el instanceof HTMLInputElement)) continue;
  showFog(k);
  el.addEventListener('input', () => { fog[k] = +el.value; showFog(k); });
}

function onParam(k: HeroParamKey) {
  if (k === 'logoSplit' || k === 'logoIdle') window.__skreedLogo?.configure({ split: params.logoSplit, idle: params.logoIdle });
}

const press = (id: string, on: boolean, label: string) => { const b = $(id); if (b) { b.setAttribute('aria-pressed', String(on)); b.textContent = label + (on ? ': on' : ': off'); } };
$('tuneReset')?.addEventListener('click', () => {
  Object.assign(params, heroParams(sceneReduced()));
  for (const k of keys) show(k);
  Object.assign(room, roomParams());
  for (const k of roomKeys) showRoom(k);
  emitRoom(null);
  Object.assign(fog, fogHueParams());
  for (const k of fogKeys) showFog(k);
  press('glitchIdle', !!params.logoIdle, 'Idle twitch');
  press('glitchSplit', params.logoSplit > 0, 'Colour split');
  onParam('logoIdle');
  emit(null);
});
$('glitchNow')?.addEventListener('click', () => { window.__skreedLogo?.burst(0.25); window.__skreedCount?.burst(0.25); });
$('glitchIdle')?.addEventListener('click', () => { params.logoIdle = params.logoIdle ? 0 : 1; press('glitchIdle', !!params.logoIdle, 'Idle twitch'); onParam('logoIdle'); emit('logoIdle'); });
$('glitchSplit')?.addEventListener('click', () => { params.logoSplit = params.logoSplit > 0 ? 0 : HERO_PARAMS.logoSplit; press('glitchSplit', params.logoSplit > 0, 'Colour split'); onParam('logoSplit'); emit('logoSplit'); });
$('ghost')?.addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLButtonElement, on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on)); b.textContent = 'Auto sweep: ' + (on ? 'on' : 'off');
  window.dispatchEvent(new CustomEvent('skreed:tune-ghost', { detail: on }));
});
