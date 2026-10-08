"""Apply the judged lighting rig to a template in place: patch1 + patch2 (the synthesised rig), then the A-final defaults."""
import sys, re, shutil
src_path = sys.argv[1]
shutil.copy(src_path, src_path + '.prelight.bak')
shutil.copy(src_path, 'light/t7_in.html')
import subprocess
subprocess.run([sys.executable, 'light/t7_patch1.py'], check=True)
subprocess.run([sys.executable, 'light/t7_patch2.py'], check=True)
s = open('light/t7_out.html').read()
# A-final defaults (judges' tweaks on the Cinematic rim preset)
FINAL = dict(key=2.0, keyX=-6, keyY=7, keyZ=10, keyRad=3.5, ktemp=1, spec=0.8, rough=0.55, alb=0.017, wrap=0.25, bevel=0.05, bevelAng=50,
             rim=2.4, rimX=-4, rimY=9, rimZ=-3, rimRad=4.5, rim2=0.75, rim2X=9, rim2Y=7, rim2Z=-3, rim2Rad=4, bounce=1.0, floor=0.24, hz=0.06, sky=0.008, amb=1, wear=0.3, occ=0.3, knee=0.55)
i = s.index('const P = {'); j = s.index('};', i) + 2
block = s[i:j]
for k, v in FINAL.items():
    block, n = re.subn(r'(\b%s:\s*)[-0-9.]+' % re.escape(k), r'\g<1>%s' % v, block, count=1)
    if n != 1: print('default not found for', k)
s = s[:i] + block + s[j:]
s = s.replace('// cinematic separation from the black sky', '// cinematic separation from the black sky (rig: judged 2026-10-08, "Cinematic rim" with the three judges\' tweaks)', 1)
open(src_path, 'w').write(s)
print('merged lighting into', src_path)
