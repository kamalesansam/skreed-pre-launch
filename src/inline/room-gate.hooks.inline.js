/* Test and staging builds only (Room.astro concatenates it when PUBLIC_HERO_HOOKS is '1'): ?room=open opens section 4 at
   load, as the page was built before the quiz gate, for the specs and scripts that drive section 4 (quiz-gate.md D6). */
window.__skreedRoomOverride = function () { return /[?&]room=open(?:&|$)/.test(location.search); };
