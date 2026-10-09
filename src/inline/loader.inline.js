/* Skreed loader: light passes, the wordmark fills with the load, dims to an outline, lifts. The prototype's loader
   (template.html lines 88 to 163) with the seven deviations of hero-architecture.md 4.3. POSE, WT and COPY are prepended by Loader.astro. */
(function(){
window.SKREED_POSE=POSE;
var D=document,HT=D.documentElement,$=function(i){return D.getElementById(i)},T0=performance.now();
if(!HT.classList.contains('loading'))return;
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,OFF=COPY.offline;
var intro=$('intro'),M=$('ldM'),GL=$('ldG'),FL=$('ldFill'),SG=$('ldS'),BD=$('ldBand'),LN=$('ldLine'),PN=$('ldN'),PC=$('ldPct'),ST=$('ldSt'),i;
if('scrollRestoration'in history)history.scrollRestoration='manual';if(!location.hash)scrollTo(0,0);
/* mask: the page's one wordmark */
var ps=$('skreed-wordmark').children,sv='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1209.46 292.9">';
for(i=0;i<ps.length;i++)sv+='<path d="'+ps[i].getAttribute('d')+'"/>';
M.style.webkitMaskImage=M.style.maskImage='url("data:image/svg+xml,'+encodeURIComponent(sv+'</svg>')+'")';M.classList.add('on');
function lw(){LN.firstChild.style.strokeWidth=(1209.46/Math.max(1,M.clientWidth)).toFixed(3)}lw();addEventListener('resize',lw);
/* measured: FF fill front, FO fill opacity, SW a pass (t,centre,strength), DM dim, SD last pass dim */
var FF=[1.64,.07,2.08,.1,2.24,.13,2.4,.15,2.56,.17,2.72,.19,2.88,.22,3.04,.26,3.2,.29,3.36,.33,3.52,.37,3.76,.43,4,.49,4.24,.54,4.48,.61,4.72,.67,4.96,.73,5.04,.75,5.12,.77,5.2,.78],
FO=[1.64,0,1.8,.19,1.92,.23,2,.35,2.08,.43,2.2,.55,2.4,.77,2.56,.86,2.72,.91,2.88,.96,3.04,1],
SW=[0,.03,0,.04,.03,14,.08,.05,32,.12,.1,45,.16,.21,50,.2,.31,61,.24,.39,70,.28,.46,79,.32,.52,86,.36,.57,94,.4,.63,100,.44,.67,106,.48,.71,111,.52,.76,116,.56,.79,120,.6,.84,126,.64,.88,137,.68,.94,161,.72,.98,176,.76,.99,172,.8,1,166,.84,1.01,159,.88,1.02,149,.92,1.02,138,.96,1.04,127,1,1.04,115,1.04,1.06,104,1.08,1.06,87,1.12,1.06,76,1.16,1.07,56,1.2,1.07,44,1.24,1.08,24,1.28,1.08,10,1.32,1.08,0],
DM=[0,1,.04,.99,.08,.96,.16,.89,.24,.82,.32,.7,.4,.58,.48,.48,.56,.38,.64,.28,.72,.18,.8,.12,.88,.07,.96,.04,1.04,.01,1.12,.01,1.24,0],
SD=[0,1,.68,1,.8,.575,.96,.267,1.12,.12,1.28,.05,1.44,0],
CYC=1.6,DEL=.2,LEAD=.04,FULL=4.96,END=7.05,EIN='cubic-bezier(.55,.085,.68,.53)';
function at(a,x){if(x<=a[0])return a[1];for(var j=2;j<a.length;j+=2)if(x<=a[j])return a[j-1]+(a[j+1]-a[j-1])*(x-a[j-2])/(a[j]-a[j-2]);return a[a.length-1]}
function op(a,d){for(var o=[],j=0;j<a.length;j+=2)o.push({offset:a[j]/d,opacity:a[j+1]});return o}
function tx(c){return'translateX('+((c-.5)*100).toFixed(2)+'%) skewX(-5deg)'}
var swA=null;
/* behind the loader nothing is reachable (D16): every body child except the loader, the sprite, the poster, the canvas and scripts */
function inertAll(on){for(var e=D.body.firstElementChild;e;e=e.nextElementSibling){if(e===intro||e.tagName==='SCRIPT'||e.matches('svg.sprite,picture.hero-poster,canvas#stage'))continue;if(on)e.setAttribute('inert','');else e.removeAttribute('inert')}}
if(!reduce){var k=[];for(i=0;i<SW.length;i+=3)k.push({offset:SW[i]/CYC,transform:tx(SW[i+1]),opacity:+(SW[i+2]/176).toFixed(3)});
  k.push({offset:1,transform:tx(SW[1]),opacity:0});swA=BD.animate(k,{duration:CYC*1e3,delay:DEL*1e3,iterations:Infinity})}
function fk(t,d,t0){return{offset:Math.min(1,(t-t0)/d),transform:'translateX('+((at(FF,t)-1.11)/1.22*100).toFixed(2)+'%) skewX(-5deg)',opacity:+at(FO,t).toFixed(3)}}
var ts=[0];for(i=0;i<FF.length;i+=2)if(FF[i]<=FULL)ts.push(FF[i]);for(i=0;i<FO.length;i+=2)ts.push(FO[i]);
ts.sort(function(a,b){return a-b});var fA=FL.animate(ts.map(function(t){return fk(t,FULL,0)}),{duration:FULL*1e3,fill:'forwards'});
var p=0,pm=0,ready=false,manual=false,got={},lastP=T0,ph='load',mode='',tl=0,last=-1,E=0,n=-1,raf=0,XA=[];
function pend(){for(var q in WT)if(!got[q])return q}
function show(v){v=Math.max(0,Math.min(100,Math.floor(v)));if(v!==n){n=v;PN.textContent=v;intro.setAttribute('aria-valuenow',v)}}
/* the dim starts with the next pass */
function sched(now){var w=0;if(swA&&swA.currentTime!=null){var c=(swA.currentTime/1e3-DEL)%CYC;w=c<.06?-(c+LEAD):CYC-LEAD-c}exit(now+w*1e3)}
function exit(e){ph='exit';E=e;if(reduce){enter();return}
  XA=[GL.animate(op(DM,1.24),{duration:1240,fill:'forwards'}),SG.animate(op(SD,1.44),{duration:1440,fill:'forwards'}),
  LN.animate([{opacity:0},{opacity:0,offset:.83},{opacity:1}],{duration:240,fill:'forwards'}),
  FL.animate([4.96,5.04,5.12,5.2].map(function(t){return fk(t,.24,FULL)}),{duration:240,fill:'forwards'})];
  XA.forEach(function(a){a.startTime=e})}
function enter(){ph='enter';setTimeout(function(){show(100)},reduce?0:120);
  PC.animate([{opacity:1},{opacity:0}],{duration:400,delay:300,easing:EIN,fill:'forwards'});setTimeout(lift,reduce?0:500)}
function lift(){if(ph==='done')return;ph='lift';intro.style.pointerEvents='none';HT.classList.remove('loading');inertAll(false);if(window.__introDone)window.__introDone();
  intro.animate([{opacity:1},{opacity:0}],{duration:reduce?400:600,easing:EIN,fill:'forwards'}).onfinish=done}
function done(){cancelAnimationFrame(raf);ph='done';if(swA)swA.cancel();intro.remove()}
function abort(){ph='done';cancelAnimationFrame(raf);if(swA)swA.cancel();fA.cancel();XA.forEach(function(a){a.cancel()});inertAll(false);HT.classList.remove('loading');intro.remove()}
function poster(msg,kind){if(mode==='poster'||ph!=='load')return;mode='poster';if(swA)swA.cancel();
  GL.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});LN.animate([{opacity:0},{opacity:1}],{duration:400,fill:'forwards'});
  PC.hidden=true;ST.textContent=msg||'';intro.classList.add('po');intro.removeAttribute('role');HT.classList.remove('loading');
  inertAll(false);HT.classList.replace('hero3d','poster');if(window.__skreedOnPoster)window.__skreedOnPoster(kind,msg)}
function tick(now){raf=requestAnimationFrame(tick);
  if(last<0){if((swA||fA).startTime==null)return;last=now}
  var dt=Math.max(0,Math.min(.25,(now-last)/1e3));last=now;
  if(ph==='load'){var nx=pend();
    if(!manual&&nx&&!ready)p=Math.max(p,Math.min(pm+.9*WT[nx],p+.02*dt));
    tl=(fA.currentTime||0)/1e3;
    if(mode==='poster'){if(ready){ph='enter';HT.classList.replace('poster','hero3d');lift()}return}
    var sl=!ready&&now-lastP>4e3?/[tyd]$/.test(nx||'')?'Slow connection':'Still loading':'';if(sl!==ST.textContent)ST.textContent=sl;
    if(!manual&&!ready&&now-lastP>(got.scene?12e3:2e4)){poster('','stall');return}
    if(tl>=1.64+(FULL-1.64)*Math.min(1,p)-.001){if(fA.playState==='running')fA.pause()}
    else{var sp=reduce||swA&&swA.currentTime/1e3-tl>.15?2:1;if(fA.playbackRate!==sp)fA.updatePlaybackRate(sp);if(fA.playState==='paused')fA.play()}
    if(ready&&tl>=FULL-.001)sched(now)}
  else if(ph==='exit'){tl=Math.max(FULL,Math.min(END,FULL+(now-E)/1e3));if(tl>=END)enter()}
  if(ph==='load'||ph==='exit')show(tl/END*99)}
window.__skreedLoaderReport=function(m){if(manual||!WT[m]||got[m])return;got[m]=1;lastP=performance.now();
  pm=Math.min(1,pm+WT[m]);p=Math.max(p,pm);if(m==='frame2'){ready=true;p=1}};
window.__skreedLoader={
  setProgress:function(v){manual=true;p=Math.min(1,Math.max(0,+v||0))},
  ready:function(){manual=true;p=1;ready=true},
  cut:function(){manual=true;p=1;ready=true;if(ph==='load'){fA.finish();exit(performance.now())}},
  skip:function(){manual=true;ready=true;if(ph!=='done'&&ph!=='lift'){ph='enter';lift()}},
  fail:function(m){poster(m,'fail')},
  inert:inertAll,
  abort:abort,
  seek:function(t){manual=ready=true;p=1;cancelAnimationFrame(raf);if(swA){swA.pause();swA.currentTime=t*1e3}fA.pause();fA.currentTime=Math.min(t,FULL)*1e3;
    if(t>=FULL&&!XA.length)exit(performance.now());XA.forEach(function(a){a.pause();a.currentTime=(t-FULL)*1e3});tl=Math.min(END,t);show(tl/END*99);ph='seek'},
  state:function(){return{phase:ph,mode:mode,p:p,tl:tl,n:n,ready:ready,note:ST.textContent,next:pend()}}};
if(!navigator.onLine)poster(OFF,'offline');
addEventListener('offline',function(){if(!ready)poster(OFF,'offline')});
raf=requestAnimationFrame(tick);
})();
