import json
t=open('template2.html').read()
t=t.replace('/*PIECES*/null',open('pieces.json').read()).replace('/*SHADES*/null',open('../hero-v1/shades.min.json').read())
open('index.html','w').write(t)
