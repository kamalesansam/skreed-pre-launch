// The loader (hero-architecture.md 4.3): src/inline/loader.inline.js is the prototype's loader (template.html lines 89 to
// 163) with exactly the seven listed deviations. Undoing them must give the prototype's text byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// [port text, prototype text], in the order of the deviations
const UNDO: [string, string][] = [
  ["window.SKREED_POSE=POSE;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();\nif(!HT.classList.contains('loading'))return;",
    "var POSE={cam:[0,-2.5,24],tgt:[0,-1,0],fov:30,lw:5.6,z:.475};window.SKREED_POSE=POSE;\nvar WT=/*WT*/null;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();"],
  ['OFF=COPY.offline;', "OFF='You are offline. The countdown still runs.';"],
  ["history.scrollRestoration='manual';if(!location.hash)scrollTo(0,0);", "history.scrollRestoration='manual';scrollTo(0,0);"],
  ["var swA=null;\n/* behind the loader nothing is reachable (D16): every body child except the loader, the sprite, the poster, the canvas and scripts */\nfunction inertAll(on){for(var e=D.body.firstElementChild;e;e=e.nextElementSibling){if(e===intro||e.tagName==='SCRIPT'||e.matches('svg.sprite,picture.hero-poster,canvas#stage'))continue;if(on)e.setAttribute('inert','');else e.removeAttribute('inert')}}", 'var swA=null;'],
  ["HT.classList.remove('loading');inertAll(false);if(window.__introDone)", "HT.classList.remove('loading');if(window.__introDone)"],
  ['function poster(msg,kind){', 'function poster(msg){'],
  ["intro.removeAttribute('role');HT.classList.remove('loading');\n  inertAll(false);HT.classList.replace('hero3d','poster');if(window.__skreedOnPoster)window.__skreedOnPoster(kind,msg)}", "intro.removeAttribute('role');HT.classList.remove('loading')}"],
  ["poster('','stall');return}", "var fb=$('fallback');poster(got.scene?fb&&fb.textContent:'');return}"],
  ["if(ready){ph='enter';HT.classList.replace('poster','hero3d');lift()}", "if(ready){ph='enter';lift()}"],
  ["fail:function(m){poster(m,'fail')},\n  inert:inertAll,\n  abort:abort,", 'fail:function(m){poster(m)},'],
  ["if(!navigator.onLine)poster(OFF,'offline');\naddEventListener('offline',function(){if(!ready)poster(OFF,'offline')});", "if(!navigator.onLine)poster(OFF);\naddEventListener('offline',function(){if(!ready)poster(OFF)});"],
  ["intro.remove()}\nfunction abort(){ph='done';cancelAnimationFrame(raf);if(swA)swA.cancel();fA.cancel();XA.forEach(function(a){a.cancel()});inertAll(false);HT.classList.remove('loading');intro.remove()}", 'intro.remove()}'],
];

test('the loader is the prototype loader plus the seven deviations, nothing else', () => {
  let port = read('src/inline/loader.inline.js');
  port = port.slice(port.indexOf('(function(){'));
  for (const [now, was] of UNDO) {
    assert.equal(port.split(now).length - 1, 1, `deviation text not found exactly once: ${now.slice(0, 60)}`);
    port = port.replace(now, was);
  }
  const t = read('prototypes/hero-v9/template.html');
  const start = t.indexOf('<script>/* Skreed loader') + '<script>'.length;
  const proto = t.slice(t.indexOf('(function(){', start), t.indexOf('</script><!--LOADER-END-->'));
  assert.equal(port.trimEnd(), proto.trimEnd());
});
