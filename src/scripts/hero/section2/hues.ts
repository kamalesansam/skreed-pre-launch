// The fog's shade hues (E-fog-hue; config/fog-hues.ts): one clock for both instances of the background shader, section
// 2's own (gems.ts) and section 3's ground (section3/ground.ts), so the hued fog is the same on both sides of the second
// wipe. The first caller in a frame advances the clock to the scene time t and writes the three patches; a second call
// with the same t reads the same state. Under reduced motion the phase holds at 1, so the patches stand still with the
// fog. Module state: there is one island per page, and a recovered island carries the clock on.
import { FOG_HUE_AB, createHueSlots, hueLo, liveFogHues, type FogHueParams } from '../../../config/fog-hues.ts';
import type { Background } from './background.ts';

const slots = new Float32Array(12), ab = new Float32Array(6), writeSlots = createHueSlots();
let phase = 1, tLast = -1;

/** advances the clock to t (once per t; dt capped at 0.1 s, so a hidden tab's jump is one step) and returns the parameters in use */
export function hueFrame(t: number, reduced: boolean): FogHueParams {
  const F = liveFogHues();
  if (t !== tLast) {
    const dt = tLast < 0 ? 0 : Math.min(0.1, Math.max(0, t - tLast));
    tLast = t;
    if (!reduced) phase += dt / F.hueCycle;   // accumulated, so a change of hueCycle changes the speed from then on, never the place
    writeSlots(phase, slots, ab);
  }
  return F;
}

/** the clock's phase in cycles (tests) */
export function huePhase(): number { return phase; }

/** writes the hues into one background instance's uniforms, at a strength of 0 (the plain grey fog) to 1 */
export function writeHues(U: Background['uniforms'], F: FogHueParams, strength: number): void {
  U.uHueAmt.value = F.hueOn > 0 && FOG_HUE_AB.length > 0 ? F.hueAmt * Math.min(1, Math.max(0, strength)) : 0;
  U.uHueSize.value = F.hueSize; U.uHueLo.value = hueLo(F.hueCover);
  U.uHueSlot.value.set(slots); U.uHueSlotAB.value.set(ab);
}
