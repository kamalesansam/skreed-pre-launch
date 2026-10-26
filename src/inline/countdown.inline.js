/* countdown to launch: plain script, so it runs even if the 3D module never starts. LAUNCH, LIVE and DG (the dot digits) are prepended by ScrollCue.astro. */
(function(){var T=LAUNCH;   /* 15 November 2026, 00:00 IST (skreed.in hands over to skreed.com) */
var U=['d','h','m','s'],el=U.map(function(u){return document.getElementById('cd-'+u)}),box=document.getElementById('count'),eyebrow=document.getElementById('cdEyebrow');
/* the dot-matrix digits (src/config/countdown-digits.ts): one path per digit, every set cell a circle, in a 0 x 0 sprite on body */
var NS='http://www.w3.org/2000/svg',sp=document.createElementNS(NS,'svg'),defs=document.createElementNS(NS,'defs'),r=DG.r,d2=(2*r).toFixed(2);
sp.setAttribute('class','sprite');sp.setAttribute('width','0');sp.setAttribute('height','0');sp.setAttribute('aria-hidden','true');
DG.rows.forEach(function(rows,n){var d='',cells=rows.split('/');for(var y=0;y<cells.length;y++)for(var x=0;x<cells[y].length;x++)if(cells[y].charAt(x)==='#')d+='M'+(x+.5-r).toFixed(2)+' '+(y+.5)+'a'+r+' '+r+' 0 1 0 '+d2+' 0a'+r+' '+r+' 0 1 0 -'+d2+' 0';
var p=document.createElementNS(NS,'path');p.id='dg-'+n;p.setAttribute('fill','currentColor');p.setAttribute('d',d);defs.appendChild(p)});
sp.appendChild(defs);document.body.appendChild(sp);
var uses=U.map(function(u){return box.querySelectorAll('#cdg-'+u+' use')});
function pad(n){return(n<10?'0':'')+n}
function live(){var a=document.createElement('a');a.href=LIVE.href;a.textContent=LIVE.link;eyebrow.textContent=LIVE.lead;eyebrow.appendChild(a)}
function tick(){var s=Math.max(0,Math.floor((T-Date.now())/1000)),d=Math.floor(s/86400);s-=d*86400;var h=Math.floor(s/3600);s-=h*3600;var m=Math.floor(s/60);s-=m*60;
var v=[pad(d),pad(h),pad(m),pad(s)];window.__skreedCountV=v;if(!box.dataset.hold)for(var k=0;k<4;k++)if(el[k].textContent!==v[k]){el[k].textContent=v[k];for(var j=0;j<2;j++)uses[k][j].setAttribute('href','#dg-'+v[k].charAt(j))}
box.setAttribute('data-ready','');
if(T-Date.now()<=0){live();box.hidden=true;return false;}return true;}
function loop(){if(tick())setTimeout(loop,1000-Date.now()%1000+5);}   /* aligned to the wall-clock second, so no value is skipped */
loop();
/* scroll cue (the one at the bottom centre): hides as soon as the page moves, or when there is nothing below to scroll to, in this plain script so it
   also works without WebGL and under reduced motion */
var cue=document.getElementById('cue'),R=document.documentElement;
function cueCheck(){var off=scrollY>8||R.scrollHeight<=innerHeight+8;cue.classList.toggle('is-off',off);}
addEventListener('scroll',cueCheck,{passive:true});addEventListener('resize',cueCheck);cueCheck();
new MutationObserver(cueCheck).observe(R,{attributes:true,attributeFilter:['class']});   /* the loader and the intro lock the page (overflow hidden, so nothing is below until they end) */
/* the last script in body: everything behind the loader becomes inert while it shows (D16) */
if(R.classList.contains('loading')&&window.__skreedLoader)window.__skreedLoader.inert(true);})();
