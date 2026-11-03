// The case-type takeover on the family pages (docs/specs/family-page.md 24; E-F6; Sam, 2026-11-02: "when they rotate,
// they should have a transition from one 3d model to another ... make the exact same transition"). depth.fyi's material
// takeover, measured from its built module and from Sam's recording of it (24.1), and re-created for two models: the
// incoming case takes the outgoing one over in a sweep across the screen, the boundary roughened by two layers of noise
// and lined with a narrow icy band. Since 2026-11-03 (Sam: "the transition animation comes after the rotation, it should
// come simultaneously ... not after the rotation") the sweep runs on the scroll instead of a clock, and since later that
// day (Sam: "rotate 360 degrees completely ... after the rotation only comes the transition effect") after the case's whole turn
// (three/takeover.ts) and its field is read on the screen instead of in each case's own space (three/takeover-material.ts),
// so depth.fyi's 1,350 ms run, its 240 ms finish and its mirrored axis are measurements in 24.1 and no longer values
// here. Plain data, read by the mapping, the shader and the stage; the unit tests import it under Node. Nothing of
// depth.fyi ships: every value below is a measurement, written into our own code.

export const TAKEOVER = Object.freeze({
  /** p = from + (to - from) x eased: the boundary starts and ends past the case, so the noise never shows it at rest (measured: -0.12 to 1.12) */
  pFrom: -0.12,
  pTo: 1.12,
  /** the boundary's large wander: fBm of value noise at 2.4 per unit of the case's height on the screen, times 0.14 of the sweep (measured: 2.4 x 0.14) */
  majorScale: 2.4,
  majorStrength: 0.14,
  /** the boundary's fine edge: the same fBm at 8 per unit, times 0.025 (measured: 8 x 0.025) */
  detailScale: 8,
  detailStrength: 0.025,
  /** the fBm: four octaves, each 2.03 times finer and half as strong, the first at 8/15 so the four sum to 1 (measured: 4, about 2.03, 0.5, 0.533) */
  octaves: 4,
  lacunarity: 2.03,
  gain: 0.5,
  firstAmp: 8 / 15,
  /**
   * the soft mask's half-width, max(0.018, 1.5 x fwidth) where one surface blends its two materials (measured: 0.018).
   * Recorded, not used: two models split hard by discard (D4), so no pixel is a blend of both cases.
   */
  feather: 0.018,
  /** the band: weight 1 - smoothstep(0, 0.03, |f - p|) either side of the boundary (measured: 0.03) */
  edgeWidth: 0.03,
  /** the band's share of the surface at its centre (measured: 0.82) */
  bandMix: 0.82,
  /** the band's surface, toward which the case's own is mixed by the band's share (measured, all of them) */
  band: Object.freeze({
    // the base colour (measured: #D5F6F3), which the stage turns into the albedo that reads it through the shades' own
    // fit (stage.ts albedo): taken as a raw albedo it blew out to white under the beats' spot, where the case's own
    // albedos are a tenth of it; through the fit the band sits in the stage's light as the shade does
    base: 0xd5f6f3,
    specular: 0xb7c1ff,       // the specular colour, sRGB (measured: #B7C1FF)
    roughness: 0.16,          // (measured: 0.16)
    metalness: 0,             // (measured: 0)
    clearcoat: 0.9,           // (measured: 0.9)
    clearcoatRoughness: 0.08, // (measured: 0.08)
    iridescence: 0.2,         // the high tier only, D7 (measured: 0.2)
    ior: 1.46,                // (measured: 1.46)
    // left out: transmission 0.06, which would cost a whole extra render of the scene behind the case on every frame of
    // a run, and the sheen at 0.12 of the base colour
  }),
  /** the band's relief: a height of band x fBm at 8 x 1.37 per unit, differentiated in screen space into a bump of 0.07 (measured: 0.07 at 8 x 1.37) */
  relief: 0.07,
  reliefFreq: 1.37,
  /**
   * The world size of depth.fyi's form along its sweep while its material picker shows: its responsive scale (0.58 at
   * 320 px to 0.9 at 1,920 px; 0.8 at a 1,440 px window, the recording's) times its extent along the sweep (about 1, the
   * forms being unit-sized). The bump is measured in view space and the form's unit is its sweep's, so the relief is
   * carried over in the sweep's own unit: its noise at 8 x 1.37 per sweep extent, its 0.07 at the ratio of the case's
   * sweep extent in the world to this. So the crumble sits in the band as the recording's does (the case's sweep, across
   * its width, is half its height; at 8 x 1.37 per unit of height the relief came out in coarse blots, looked at against
   * the recording's frames). The boundary's two noises stay per unit of height (D4).
   */
  reliefRef: 0.8,
  /** the clearcoat normal follows the bumped normal by band x 0.65 (measured: 0.65) */
  coatFollow: 0.65,
  /** each pair's noise offset: a hash of 27027 and the two case types, scaled to 0 to 37 per axis (measured: 27027, x 37) */
  seed: 27027,
  seedScale: 37,
  /**
   * D7: the band's own share of the environment light, times this at the band's centre. The beats are lit darker than
   * depth.fyi's studio (the zoom spot and the studio at 0.2), so the band may need more of it to read as the recording's
   * bright icy edge; never the scene's light. Starts at 1; tuned against the recording (the band's luminance over the
   * surface beside it).
   */
  bandLight: 1,
});

/** The progress the band sits at for an eased progress (0 to 1) */
export const takeoverP = (eased: number): number => TAKEOVER.pFrom + (TAKEOVER.pTo - TAKEOVER.pFrom) * eased;

/** The in-out cubic on 0 to 1 (measured: 4t^3 below a half, 1 - (2 - 2t)^3 / 2 above) */
export function easeTakeover(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (2 - 2 * x) ** 3 / 2;
}
