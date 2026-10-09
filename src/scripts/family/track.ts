// Analytics events of the family pages (docs/specs/family-page.md 5 "Outputs"). PostHog is not on the site yet
// (CHECKLIST G18 arrives with its own section), so every event is dispatched as a `skreed:track` CustomEvent on
// window; the analytics section subscribes to it and forwards to PostHog without touching this module.
export type TrackEvent = 'family_open' | 'shade_selected' | 'finish_selected' | 'reserve_click' | 'model_load_failed' | 'stage_mode';

export function track(event: TrackEvent, props: Record<string, string | number | boolean> = {}): void {
  dispatchEvent(new CustomEvent('skreed:track', { detail: { event, props } }));
}
