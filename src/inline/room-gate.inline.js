/* The quiz gate's inline step (docs/specs/quiz-gate.md D2): section#room is rendered hidden and data-locked, and a visit
   that has already opened it (the quiz's result, or Skip quiz: the flag the quiz's chunk writes to sessionStorage) opens
   it again here, right after the section is parsed and before anything below the quiz can paint, leaving the attributes
   as the one state every script reads. KEY is prepended by Room.astro from config/quiz.ts; test and staging builds
   prepend the ?room=open override (room-gate.hooks.inline.js), which writes the flag before the read and opens the
   section itself where storage throws. Nothing here depends on the tier, and nothing moves. */
(function () {
  var r = document.getElementById('room'), o = window.__skreedRoomOverride ? window.__skreedRoomOverride() : false, v = '';
  if (!r) return;
  if (o) { try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* no storage: the override opens the section itself */ } }
  try { v = sessionStorage.getItem(KEY); } catch (e) { /* no storage: the page starts locked */ }
  if (v === '1' || o) { r.removeAttribute('hidden'); r.removeAttribute('data-locked'); r.setAttribute('data-open', 'visit'); }
})();
