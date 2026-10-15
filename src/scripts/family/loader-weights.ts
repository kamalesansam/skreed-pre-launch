// The family page's loader milestones (docs/specs/family-page.md 20 "The loader"), the weights the shell's loader counts
// with (Loader.astro `weights`): each milestone's measured share of a family load. The island reports them in this
// order; the last one must be "frame2" (the loader's own name for the first frame, which sets it ready). They sum to 1.
export const FAMILY_WT = { import: 0.42, lod1: 0.1, env: 0.08, compile: 0.22, lod0: 0.1, frame2: 0.08 } as const;
