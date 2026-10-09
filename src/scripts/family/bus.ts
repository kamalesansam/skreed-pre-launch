// The one channel between the page module (selection, DOM) and the 3D island (lineup, picking, drag), both on the
// family pages. Events on document, so neither side imports the other and an off build has no island at all.
export type Input = 'tap' | 'drag' | 'key' | 'scrubber' | 'grid' | 'prev_next' | 'deeplink';
export type Finish = 'matte' | 'gloss';
export interface BusMap {
  /** page to island: the selection changed (index 0 to 23); instant for a deep link or reduced motion */
  'fam:select': { i: number; input: Input; instant: boolean };
  /** page to island: the finish changed */
  'fam:finish': { finish: Finish };
  /** island to page: the visitor tapped or dragged the lineup to this case (index 0 to 23); dragging while a finger is down */
  'fam:pick': { i: number; input: Input; dragging?: boolean };
  /** island to page: the 3D path failed or is not available; the page shows swatch grid mode with this state line */
  'fam:grid': { reason: string; message?: 'failed' | 'failedTwice' | 'offline' | 'saveData' | 'slowConnection' | ''; retry?: () => void };
  /** island to page: the slow-network line on (after 8 s) or off */
  'fam:slow': { on: boolean };
  /** page to island: the visitor asked for the 3D on data saver or 2G ("Show in 3D") */
  'fam:want3d': Record<string, never>;
  /** island to page: the first live frame is up */
  'fam:live': Record<string, never>;
}
export function emit<K extends keyof BusMap>(type: K, detail: BusMap[K]): void {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}
export function on<K extends keyof BusMap>(type: K, fn: (d: BusMap[K]) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<BusMap[K]>).detail);
  document.addEventListener(type, h);
  return () => document.removeEventListener(type, h);
}
