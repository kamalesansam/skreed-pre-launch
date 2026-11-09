/* The countdown to launch on the redesigned landing page (docs/specs/redesign.md D13): the countdown part of countdown.inline.js without the old hero's cue and loader lines, and, since D19, with the colon's path made beside the digits'. Plain script, so it ticks even if no module starts. LAUNCH, LIVE and DG (the dot digits and the colon) are prepended by Launch.astro. */
(function(){var T=LAUNCH;   /* 19 November 2026, 00:00 IST (skreed.in hands over to skreed.com) */
var U=['d','h','m','s'],el=U.map(function(u){return document.getElementById('cd-'+u)}),box=document.getElementById('count'),eyebrow=document.getElementById('cdEyebrow');
/* the dot-matrix digits (src/config/countdown-digits.ts): one path per digit, every set cell a circle, in a 0 x 0 sprite on body */
var NS='http://www.w3.org/2000/svg',sp=document.createElementNS(NS,'svg'),defs=document.createElementNS(NS,'defs'),r=DG.r,d2=(2*r).toFixed(2);
sp.setAttribute('class','sprite');sp.setAttribute('width','0');sp.setAttribute('height','0');sp.setAttribute('aria-hidden','true');
function dots(rows,id){var d='',cells=rows.split('/');for(var y=0;y<cells.length;y++)for(var x=0;x<cells[y].length;x++)if(cells[y].charAt(x)==='#')d+='M'+(x+.5-r).toFixed(2)+' '+(y+.5)+'a'+r+' '+r+' 0 1 0 '+d2+' 0a'+r+' '+r+' 0 1 0 -'+d2+' 0';
var p=document.createElementNS(NS,'path');p.id=id;p.setAttribute('fill','currentColor');p.setAttribute('d',d);defs.appendChild(p)}
DG.rows.forEach(function(rows,n){dots(rows,'dg-'+n)});
/* the colon between one pair and the next (D19, item 9; Sam, 2026-11-09: "add dots for the countdown timer"): the same dots from the colon's own bitmap, one path, which the row's three svg.colon draw. Its id is not a digit's (no dg-) and its uses sit outside every #cdg-<unit>, so nothing that looks for the digits or the pairs finds it */
dots(DG.colon,'rd-colon');
sp.appendChild(defs);document.body.appendChild(sp);
var uses=U.map(function(u){return box.querySelectorAll('#cdg-'+u+' use')});
function pad(n){return(n<10?'0':'')+n}
function live(){var a=document.createElement('a');a.href=LIVE.href;a.textContent=LIVE.link;eyebrow.textContent=LIVE.lead;eyebrow.appendChild(a)}
function tick(){var s=Math.max(0,Math.floor((T-Date.now())/1000)),d=Math.floor(s/86400);s-=d*86400;var h=Math.floor(s/3600);s-=h*3600;var m=Math.floor(s/60);s-=m*60;
var v=[pad(d),pad(h),pad(m),pad(s)];window.__skreedCountV=v;if(!box.dataset.hold)for(var k=0;k<4;k++)if(el[k].textContent!==v[k]){el[k].textContent=v[k];for(var j=0;j<2;j++)uses[k][j].setAttribute('href','#dg-'+v[k].charAt(j))}
box.setAttribute('data-ready','');
if(T-Date.now()<=0){live();box.hidden=true;return false;}return true;}
function loop(){if(tick())setTimeout(loop,1000-Date.now()%1000+5);}   /* aligned to the wall-clock second, so no value is skipped */
loop();})();
