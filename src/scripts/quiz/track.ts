// Section 3's analytics events (docs/specs/quiz.md 5): queued on the window until an analytics client exists
// (PostHog arrives with CHECKLIST G18, which drains the queue). Nothing leaves the page from here.
declare global {
  interface Window { __skreedEvents?: { name: string; props: Record<string, string | number>; t: number }[] }
}

export function track(name: string, props: Record<string, string | number> = {}): void {
  (window.__skreedEvents ??= []).push({ name, props, t: Date.now() });
}
