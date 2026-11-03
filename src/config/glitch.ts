// The glitch's parameters, in their own module so the critical SiteLogo chunk does not carry the island's 66-key params
// table. HERO_PARAMS (params.ts) takes its logoIdle and logoSplit from here.
import { PAIR_W, PAIR_H } from './countdown-digits.ts';
import type { GlitchTarget } from '../scripts/logotype/glitch.ts';

/** The idle twitch: on (Sam, 2026-10-26: "make sure it glitches more often, on the logo as well as the countdown"; it
 *  was 0 in production for WCAG 2.2.2, spec D20, now exception E-CD-glitch pending with E-2.2.2). The prototype had 1. */
export const LOGO_IDLE = 1;
/** The idle twitch's wait between bursts, seconds, drawn at random in this range; the prototype waited 8 to 16. */
export const IDLE_EVERY: readonly [number, number] = [3, 7];
/** Share of the glitch slabs that get the colour split. */
export const LOGO_SPLIT = 0.4;
/** The countdown's glitch target (E-CD-glitch): one pair of dot digits, 17.5 by 13; kicks of 3% of the width (about
 *  2 px at 64 px tall, the logotype's 1.05% of 136 px being 1.4 px); 5 rows of 3 slabs on the near-square pair. */
export const COUNT_TARGET: Omit<GlitchTarget, 'href' | 'prefix'> = { w: PAIR_W, h: PAIR_H, amp: 0.03, rows: 5, segs: 3 };
/** The section index's gift (2026-11-03: "has that same glitch effect as the logo, but glitches more often"): its idle
 *  twitch waits 1.2 to 3 s, against the logotype's 3 to 7. */
export const GIFT_EVERY: readonly [number, number] = [1.2, 3];
/** The gift's glitch target: Bootstrap Icons' gift, 16 by 16; kicks of 6% of its width (about 1 px at 18 px), 4 rows of 2 slabs. */
export const GIFT_TARGET: Omit<GlitchTarget, 'href' | 'prefix'> = { w: 16, h: 16, amp: 0.06, rows: 4, segs: 2 };
