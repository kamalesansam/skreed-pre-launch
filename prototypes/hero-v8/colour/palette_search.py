import json, itertools, numpy as np
O=json.load(open('oklch10.json')); names=list(O)
E=[(0,2,1),(0,4,1),(1,3,1),(1,5,1),(4,6,1),(5,7,1),(6,8,1),(7,9,1),(3,2,.5),(9,0,.5),(1,8,.5),(9,2,.5),(3,8,.5)]
def pair(a,b):
    La,Ca,ha=O[a]; Lb,Cb,hb=O[b]
    na, nb = Ca<0.02, Cb<0.02
    if na and nb: return 0.8
    if na or nb: return 0.3
    dh=abs(ha-hb); dh=min(dh,360-dh)
    if dh<=60: c=(dh/60)**2
    elif dh<=120: c=1+(dh-60)/60*1.5
    else: c=2.5-(dh-120)/60*0.5
    if abs(La-Lb)<0.06 and min(Ca,Cb)>0.12: c+=0.3   # equal lightness, both saturated: the edge vibrates
    return c
M=np.array([[pair(a,b) for b in names] for a in names])
best=[]
for perm in itertools.permutations(range(10)):
    s=0.0
    for i,j,w in E: s+=w*M[perm[i],perm[j]]
    best.append((s,perm))
best.sort(key=lambda x:x[0])
seen=set(); out=[]
for s,p in best:
    key=tuple(names[k] for k in p)
    out.append((round(s,3),key))
    if len(out)>=12: break
cur=['Amethyst','Crimson','Rouge','Silver','Sunbeam','Snow','Cinnamon','Snow','Mango','Sky']
for s,k in out: print(s,k)
json.dump(out,open('palette_best.json','w'))
