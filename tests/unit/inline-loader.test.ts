// The loader (hero-architecture.md 4.3): src/inline/loader.inline.js is the prototype's loader (template.html lines 89 to
// 163) with exactly the seven listed deviations plus v10's two (the intro's classes, the gap clock) and round 4's one (the
// return visit, family-page.md 13 step 3), as round 5 and 2026-11-04 amend it (family-page.md 23 and 27: on a return
// visit the loader lifts on the island's ready(), the class ret hiding nothing).
// Undoing them must give the prototype's text byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEMPLATE } from './proto-source.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// 2026-11-04 (E-3D-only, Sam: "make sure the real site loads on any machine or any phone or any browser, dont have this
// fallback"; Reduce motion, "Exactly the full motion"): no reduce branch, no poster state, the offline line in the status and
// fail as the site note. Undone first, newest first, so the deviations below apply to the text they were written against
const E3D_UNDO: [string, string][] = [
  ["  state:function(){return{phase:ph,p:p,tl:tl,n:n,ready:ready,note:ST.textContent,next:pend()}}};", "  state:function(){return{phase:ph,mode:mode,p:p,tl:tl,n:n,ready:ready,note:ST.textContent,next:pend()}}};\nif(!navigator.onLine)poster(OFF,'offline');\naddEventListener('offline',function(){if(!ready)poster(OFF,'offline')});"],
  ["  /* the page's own scripts did not load (the Gate's module error): one reload a visit, as shell/note.ts's failHard, then the site note, its link reloading the page; offline, the note until the connection is back */\n  fail:function(){var on=navigator.onLine!==false,k='skreed-3d-retry',c=1;try{c=+sessionStorage.getItem(k)||0;sessionStorage.setItem(k,c+1)}catch(e){c=1}\n    if(on&&c<1){location.reload();return}abort();HT.classList.add('nogl');HT.setAttribute('data-note',on?'failed':'offline');if(!on)addEventListener('online',function(){location.reload()},{once:true})},", "  fail:function(m){poster(m,'fail')},"],
  ["    else{var sp=swA&&swA.currentTime/1e3-tl>.15?2:1;if(fA.playbackRate!==sp)fA.updatePlaybackRate(sp);if(fA.playState==='paused')fA.play()}", "    else{var sp=reduce||swA&&swA.currentTime/1e3-tl>.15?2:1;if(fA.playbackRate!==sp)fA.updatePlaybackRate(sp);if(fA.playState==='paused')fA.play()}"],
  ["    var sl=!ready&&!navigator.onLine?OFF:!ready&&now-lastP>4e3?/[tyd]$/.test(nx||'')?'Slow connection':'Still loading':'';if(sl!==ST.textContent)ST.textContent=sl;", "    if(mode==='poster'){if(ready){ph='enter';HT.classList.replace('poster','hero3d');lift()}return}\n    var sl=!ready&&now-lastP>4e3?/[tyd]$/.test(nx||'')?'Slow connection':'Still loading':'';if(sl!==ST.textContent)ST.textContent=sl;\n    if(!manual&&!ready&&now-lastP>(got.scene?12e3:2e4)){poster('','stall');return}"],
  ["function tick(now){raf=requestAnimationFrame(tick);", "function poster(msg,kind){if(mode==='poster'||ph!=='load')return;mode='poster';if(swA)swA.cancel();\n  GL.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});LN.animate([{opacity:0},{opacity:1}],{duration:400,fill:'forwards'});\n  PC.hidden=true;ST.textContent=msg||'';intro.classList.add('po');intro.removeAttribute('role');HT.classList.remove('loading','intro','uh1','uh2','uh3','uh4');\n  inertAll(false);HT.classList.replace('hero3d','poster');if(window.__skreedOnPoster)window.__skreedOnPoster(kind,msg)}\nfunction tick(now){raf=requestAnimationFrame(tick);"],
  ["  intro.animate([{opacity:1},{opacity:0}],{duration:600,easing:EIN,fill:'forwards'}).onfinish=done}", "  intro.animate([{opacity:1},{opacity:0}],{duration:reduce?400:600,easing:EIN,fill:'forwards'}).onfinish=done}"],
  ["function enter(){ph='enter';setTimeout(function(){show(100)},120);\n  PC.animate([{opacity:1},{opacity:0}],{duration:400,delay:300,easing:EIN,fill:'forwards'});setTimeout(lift,500)}", "function enter(){ph='enter';setTimeout(function(){show(100)},reduce?0:120);\n  PC.animate([{opacity:1},{opacity:0}],{duration:400,delay:300,easing:EIN,fill:'forwards'});setTimeout(lift,reduce?0:500)}"],
  ["function exit(e){ph='exit';E=e;", "function exit(e){ph='exit';E=e;if(reduce){enter();return}"],
  ["var p=0,pm=0,ready=false,manual=false,got={},lastP=T0,ph='load',tl=0,last=-1,E=0,n=-1,raf=0,XA=[];", "var p=0,pm=0,ready=false,manual=false,got={},lastP=T0,ph='load',mode='',tl=0,last=-1,E=0,n=-1,raf=0,XA=[];"],
  ["var k=[];for(i=0;i<SW.length;i+=3)k.push({offset:SW[i]/CYC,transform:tx(SW[i+1]),opacity:+(SW[i+2]/176).toFixed(3)});\n  k.push({offset:1,transform:tx(SW[1]),opacity:0});swA=BD.animate(k,{duration:CYC*1e3,delay:DEL*1e3,iterations:Infinity});", "if(!reduce){var k=[];for(i=0;i<SW.length;i+=3)k.push({offset:SW[i]/CYC,transform:tx(SW[i+1]),opacity:+(SW[i+2]/176).toFixed(3)});\n  k.push({offset:1,transform:tx(SW[1]),opacity:0});swA=BD.animate(k,{duration:CYC*1e3,delay:DEL*1e3,iterations:Infinity})}"],
  ["/* the full motion for every visitor, Reduce motion included, and no poster state: a stall or the network going keeps the loader up with its status line, and a failure is the site note's (E-3D-only, Sam 2026-11-04) */\nvar OFF=COPY.offline;", "var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,OFF=COPY.offline;"],
];

// [port text, prototype text], in the order of the deviations
const UNDO: [string, string][] = [
  ["window.SKREED_POSE=POSE;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();\nif(!HT.classList.contains('loading'))return;",
    "var POSE={cam:[0,-2.5,24],tgt:[0,-1,0],fov:30,lw:5.6,z:.475};window.SKREED_POSE=POSE;\nvar WT=/*WT*/null;\nvar D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();"],
  ['OFF=COPY.offline;', "OFF='You are offline. The countdown still runs.';"],
  ["history.scrollRestoration='manual';if(!location.hash)scrollTo(0,0);", "history.scrollRestoration='manual';scrollTo(0,0);"],
  // round 4 (family-page.md 13 step 3): the return visit, decided once (RET, the class ret). Since 2026-11-04 (family-page.md
  // 27) the loader lifts on the island's ready() on a return visit, with no wait for the fill's timeline or the dim
  ["\n/* the return path (family-page.md 2.2 and 13 step 3; built with round 4, section 22; family-page.md 27 since 2026-11-04): back from a family page, or /#families, on the landing's 3D path, where the browser had no copy of the page to restore. The loader shows as on a first visit (E-H1), the wordmark, the count, the passes, the status lines and the stall rule, but lifts as soon as the island gives its word, ready() below, which hero.ts calls once frame2 is in and section 2 is at rest: the count to 100 and the lift, with no wait for the fill's timeline or the dim (Sam, 2026-11-04: \"make the going back wait time quicker\"; the full first-visit timeline, about 7.5 s, since round 5) */\nvar RET=HT.classList.contains('hero3d')&&(location.hash==='#families'||((performance.getEntriesByType?performance.getEntriesByType('navigation'):[])[0]||{}).type==='back_forward');if(RET)intro.classList.add('ret');\n", '\n'],
  ['if(RET&&manual&&ready){fA.pause();enter();return}\n    if(ready&&!RET&&tl>=FULL-.001)sched(now)', 'if(ready&&tl>=FULL-.001)sched(now)'],
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

test('the loader is the prototype loader plus the listed deviations (the seven of 4.3, v10\'s two, round 4\'s return visit as round 5 amends it), nothing else', () => {
  let port = read('src/inline/loader.inline.js');
  port = port.slice(port.indexOf('(function(){'));
  for (const [now, was] of E3D_UNDO) {
    assert.equal(port.split(now).length - 1, 1, `2026-11-04 text not found exactly once: ${now.slice(0, 60)}`);
    port = port.replace(now, was);
  }
  for (const [now, was] of UNDO) {
    assert.equal(port.split(now).length - 1, 1, `deviation text not found exactly once: ${now.slice(0, 60)}`);
    port = port.replace(now, was);
  }
  const t = TEMPLATE;
  const start = t.indexOf('<script>/* Skreed loader') + '<script>'.length;
  const proto = t.slice(t.indexOf('(function(){', start), t.indexOf('</script><!--LOADER-END-->'));
  assert.equal(port.trimEnd(), proto.trimEnd());
});
