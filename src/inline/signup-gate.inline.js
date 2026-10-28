/* The quiz gate's inline step for section 5 (docs/specs/quiz-gate.md D2 and D9; docs/specs/section-5.md 12): section#signup
   is rendered hidden and data-locked as section#room is, since it follows section 4 in the page and a locked page must end
   at the quiz (quiz-gate.md AC1). It opens with the room: this step runs right after the section is parsed and reads the
   flag the quiz's chunk writes to sessionStorage (KEY, prepended by Signup.astro from config/quiz.ts). The room's step,
   run just before, has already written the flag for the ?room=open override of test and staging builds, and
   window.__skreedRoomOverride is that override where storage throws. Nothing here depends on the tier, and nothing moves. */
(function () {
  var s = document.getElementById('signup'), o = window.__skreedRoomOverride ? window.__skreedRoomOverride() : false, v = '';
  if (!s) return;
  try { v = sessionStorage.getItem(KEY); } catch (e) { /* no storage: the section starts locked, as the room does */ }
  if (v === '1' || o) { s.removeAttribute('hidden'); s.removeAttribute('data-locked'); s.setAttribute('data-open', 'visit'); }
})();
