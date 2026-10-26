// The loader (hero-architecture.md 4.3): src/inline/loader.inline.js is the prototype's loader (template.html lines 89 to
// 163) with exactly the seven listed deviations plus v10's two (the intro's classes, the gap clock) and round 4's one (the
// return visit's veil, family-page.md 13 step 3). Undoing them must give the prototype's text byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEMPLATE } from './proto-source.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// [port text, prototype text], in the order of the deviations
const UNDO: [string, string][] = [
  ["window.SKREED_POSE=POSE;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();\nif(!HT.classList.contains('loading'))return;",
    "var POSE={cam:[0,-2.5,24],tgt:[0,-1,0],fov:30,lw:5.6,z:.475};window.SKREED_POSE=POSE;\nvar WT=/*WT*/null;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();"],
  ['OFF=COPY.offline;', "OFF='You are offline. The countdown still runs.';"],
  ["history.scrollRestoration='manual';if(!location.hash)scrollTo(0,0);", "history.scrollRestoration='manual';scrollTo(0,0);"],
  // round 4 (family-page.md 13 step 3): the return visit, a veil the island lifts through skip(); never Back to top's way home
  ["\n/* the return path (family-page.md 2.2 and 13 step 3; built with round 4, section 22): back from a family page, or /#families, on the landing's 3D path. A night veil (no wordmark, no percent) that the island lifts through skip() once frame2 is in and section 2 is at rest; never the fill's wait and the exit. Not for Back to top's way home (to-top.ts sets skreed:to-top before it steps back): on a cache miss that load starts at the top, its hash dropped so the browser's own scroll to the fragment cannot undo it */\nvar TT=false;try{TT=sessionStorage.getItem('skreed:to-top')==='1'}catch(e){}\nvar RET=!TT&&HT.classList.contains('hero3d')&&(location.hash==='#families'||((performance.getEntriesByType?performance.getEntriesByType('navigation'):[])[0]||{}).type==='back_forward');if(RET)intro.classList.add('ret');\nif(TT){scrollTo(0,0);if(location.hash)history.replaceState(history.state,'',location.pathname+location.search)}\n", '\n'],
  ['if(ready&&!RET&&tl>=FULL-.001)sched(now)', 'if(ready&&tl>=FULL-.001)sched(now)'],
  ["var swA=null;\n/* behind the loader nothing is reachable (D16): every body child except the loader, the sprite, the poster, the canvas and scripts */\nfunction inertAll(on){for(var e=D.body.firstElementChild;e;e=e.nextElementSibling){if(e===intro||e.tagName==='SCRIPT'||e.matches('svg.sprite,picture.hero-poster,canvas#stage'))continue;if(on)e.setAttribute('inert','');else e.removeAttribute('inert')}}", 'var swA=null;'],
  ["HT.classList.remove('loading');inertAll(false);if(window.__introDone)", "HT.classList.remove('loading');if(window.__introDone)"],
  ['function poster(msg,kind){', 'function poster(msg){'],
  ["intro.removeAttribute('role');HT.classList.remove('loading','intro','uh1','uh2','uh3','uh4');\n  inertAll(false);HT.classList.replace('hero3d','poster');if(window.__skreedOnPoster)window.__skreedOnPoster(kind,msg)}", "intro.removeAttribute('role');HT.classList.remove('loading')}"],
  ["  var g=now-last,dt=Math.max(0,Math.min(.25,g/1e3));if(g>500)lastP=Math.min(now,lastP+g);last=now;   /* a hidden tab's gap never counts as a stall */", "  var dt=Math.max(0,Math.min(.25,(now-last)/1e3));last=now;"],
  ["poster('','stall');return}", "var fb=$('fallback');poster(got.scene?fb&&fb.textContent:'');return}"],
  ["if(ready){ph='enter';HT.classList.replace('poster','hero3d');lift()}", "if(ready){ph='enter';lift()}"],
  ["fail:function(m){poster(m,'fail')},\n  inert:inertAll,\n  abort:abort,", 'fail:function(m){poster(m)},'],
  ["if(!navigator.onLine)poster(OFF,'offline');\naddEventListener('offline',function(){if(!ready)poster(OFF,'offline')});", "if(!navigator.onLine)poster(OFF);\naddEventListener('offline',function(){if(!ready)poster(OFF)});"],
  ["intro.remove()}\nfunction abort(){ph='done';cancelAnimationFrame(raf);if(swA)swA.cancel();fA.cancel();XA.forEach(function(a){a.cancel()});inertAll(false);HT.classList.remove('loading');intro.remove()}", 'intro.remove()}'],
];

test('the loader is the prototype loader plus the listed deviations (the seven of 4.3, v10\'s two, round 4\'s return visit), nothing else', () => {
  let port = read('src/inline/loader.inline.js');
  port = port.slice(port.indexOf('(function(){'));
  for (const [now, was] of UNDO) {
    assert.equal(port.split(now).length - 1, 1, `deviation text not found exactly once: ${now.slice(0, 60)}`);
    port = port.replace(now, was);
  }
  const t = TEMPLATE;
  const start = t.indexOf('<script>/* Skreed loader') + '<script>'.length;
  const proto = t.slice(t.indexOf('(function(){', start), t.indexOf('</script><!--LOADER-END-->'));
  assert.equal(port.trimEnd(), proto.trimEnd());
});
