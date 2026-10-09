// The logotype glitch's two parameters, in their own module so the critical SiteLogo chunk does not carry the island's
// 66-key params table. HERO_PARAMS (params.ts) takes its logoIdle and logoSplit from here.
/** The idle twitch every 8 to 16 s: off in production (WCAG 2.2.2, spec D20); the prototype had 1. */
export const LOGO_IDLE = 0;
/** Share of the glitch slabs that get the colour split. */
export const LOGO_SPLIT = 0.4;
