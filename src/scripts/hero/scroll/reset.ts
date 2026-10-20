// Undoes every inline style the DOM ride wrote (the hard poster path, hero-architecture.md 7.3 step 4). Its own module,
// with no scroll maths, because boot.ts (the critical chunk) imports it.

export interface RideEls { heroCopy: HTMLElement | null; cue: HTMLElement | null; labels: HTMLElement | null; siteLogo: HTMLElement | null }

export function resetRiders(els: RideEls): void {
  const c = els.heroCopy;
  if (c) { c.style.removeProperty('transform'); c.style.removeProperty('clip-path'); c.style.removeProperty('visibility'); if (!c.getAttribute('style')) c.removeAttribute('style'); }
  if (els.siteLogo) delete els.siteLogo.dataset.tone;
  if (els.labels) { els.labels.replaceChildren(); els.labels.style.removeProperty('visibility'); if (!els.labels.getAttribute('style')) els.labels.removeAttribute('style'); }
}
