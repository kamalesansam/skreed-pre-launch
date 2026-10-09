/* countdown to launch: plain script, so it runs even if the 3D module never starts. LAUNCH and LIVE are prepended by ScrollCue.astro. */
(function(){var T=LAUNCH;   /* 1 November 2026, 00:00 IST (skreed.in hands over to skreed.com) */
var el=['cd-d','cd-h','cd-m','cd-s'].map(function(i){return document.getElementById(i)}),box=document.getElementById('count'),eyebrow=document.getElementById('cdEyebrow');
function pad(n){return(n<10?'0':'')+n}
function live(){var a=document.createElement('a');a.href=LIVE.href;a.textContent=LIVE.link;eyebrow.textContent=LIVE.lead;eyebrow.appendChild(a)}
function tick(){var s=Math.max(0,Math.floor((T-Date.now())/1000)),d=Math.floor(s/86400);s-=d*86400;var h=Math.floor(s/3600);s-=h*3600;var m=Math.floor(s/60);s-=m*60;
var v=[pad(d),pad(h),pad(m),pad(s)];window.__skreedCountV=v;if(!box.dataset.hold)for(var k=0;k<4;k++)if(el[k].textContent!==v[k])el[k].textContent=v[k];
box.setAttribute('data-ready','');
if(T-Date.now()<=0){live();box.hidden=true;return false;}return true;}
function loop(){if(tick())setTimeout(loop,1000-Date.now()%1000+5);}   /* aligned to the wall-clock second, so no value is skipped */
loop();
/* scroll cue: hides as soon as the page moves, or when there is nothing below to scroll to, in this plain script so it also
   works without WebGL and under reduced motion */
var cue=document.getElementById('cue'),R=document.documentElement;
function cueCheck(){cue.classList.toggle('is-off',scrollY>8||R.scrollHeight<=innerHeight+8);}
addEventListener('scroll',cueCheck,{passive:true});addEventListener('resize',cueCheck);cueCheck();
/* the last script in body: everything behind the loader becomes inert while it shows (D16) */
if(R.classList.contains('loading')&&window.__skreedLoader)window.__skreedLoader.inert(true);})();
