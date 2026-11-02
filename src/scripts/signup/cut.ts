// The fourth wipe's clear line (docs/specs/section-5-picture.md 18; Sam, 2026-11-03: "the transition is not done
// properly, i could see that box"). The island's cut (hero/v11/glsl.ts wipe(), igloo's diagonal of ice shards) rises from
// the foot of the canvas along a line that falls to the right; each pixel's place on the sweep is moved by its own texel
// (the scroll texture's blue channel) and each pixel turns over by its own shard value (the red channel), so the front is
// a ragged band. Below the clear line every pixel is already the incoming frame, whatever its texels: section 5's lines
// can show there on the canvas's ground, with no box of the section's own rising under the cut. Pure numbers, so
// tests/unit/signup-cut.test.ts holds them to the shader's.

/** the cut's numbers in wipe(): the slope (0.2 of the aspect), the texel's sweep displacement (0.4), the sweep's margin (0.2) */
export const CUT = Object.freeze({ slope: 0.2, disp: 0.4, margin: 0.2 });

/**
 * The clear line y = c + k * x on the canvas's box (CSS px from its top left) for the cut at w (0 to 1) with the shader's
 * aspect: a pixel is wholly the incoming frame once its sweep, v + (u + disp) * slope * aspect at worst, is at most
 * -margin + (1 + margin) * incP (falloff's start), with incP = w * (1 + slope * aspect), v = 1 - y / ch and u = x / cw.
 */
export function clearLine(w: number, cw: number, ch: number, aspect: number): { c: number; k: number } {
  const { slope, disp, margin } = CUT, sa = slope * aspect;
  return { c: ch * ((1 + margin) + disp * sa - (1 + margin) * w * (1 + sa)), k: sa * ch / cw };
}

/** a box in viewport CSS px */
export interface Box { readonly left: number; readonly top: number; readonly width: number }

/**
 * The mask that shows an element only below the clear line, from `lead` px past the line and whole `soft` px further
 * on: a linear gradient at 180 + atan(k) degrees, whose stops sit on lines parallel to the clear line (on an element W px
 * wide, CSS puts the line y = c + k * x of the element's own px at sin * W + cos * c along the gradient line).
 */
export function clearMask(w: number, canvas: Box & { readonly height: number }, aspect: number, el: Box, lead: number, soft: number): string {
  const { c, k } = clearLine(w, canvas.width, canvas.height, aspect);
  const ce = c + k * (el.left - canvas.left) - (el.top - canvas.top);   // the line in the element's own px
  const n = Math.hypot(1, k), t = (k * el.width + ce) / n + lead;
  return `linear-gradient(${(180 + (Math.atan(k) * 180) / Math.PI).toFixed(4)}deg, transparent ${t.toFixed(1)}px, #000 ${(t + soft).toFixed(1)}px)`;
}
