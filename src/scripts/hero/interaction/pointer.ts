// Pointer input (prototype lines 1073 to 1081): any active pointer, touch included, in normalised device coordinates.
// lastInput starts in the distant past, so on touch the ghost sweep starts the moment the hero's life is full.
import { Vector2 } from 'three';

export interface Pointer { ndc: Vector2; active: boolean; lastInput: number; dispose(): void }

export function createPointer(): Pointer {
  const p: Pointer = { ndc: new Vector2(0, 0), active: false, lastInput: -1e9, dispose: () => {} };
  const onMove = (x: number, y: number) => { p.ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); p.active = true; p.lastInput = performance.now(); };
  const move = (e: PointerEvent) => onMove(e.clientX, e.clientY);
  const leave = () => { p.active = false; };
  const up = (e: PointerEvent) => { if (e.pointerType !== 'mouse') p.active = false; };
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerdown', move, { passive: true });
  document.addEventListener('pointerleave', leave);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', leave);
  p.dispose = () => {
    removeEventListener('pointermove', move); removeEventListener('pointerdown', move);
    document.removeEventListener('pointerleave', leave); removeEventListener('pointerup', up); removeEventListener('pointercancel', leave);
  };
  return p;
}

/** The slow sweep on touch when idle (prototype line 1293). */
export const ghostTarget = (t: number): Vector2 => new Vector2(Math.sin(t * 0.45) * 0.55, Math.sin(t * 0.31 + 1) * 0.3 + 0.1);
