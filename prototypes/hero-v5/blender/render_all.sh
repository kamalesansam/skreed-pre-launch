set -e
cd "$(dirname "$0")"
for k in canyon spires dunes; do ../bl/bin/python scene.py $k 2600 1560 32 $PWD/hi_$k.png > log_$k.txt 2>&1; done
../bl/bin/python post.py hi_canyon.png final_canyon.png 0.22,0.16,0.19,0.0035
../bl/bin/python post.py hi_spires.png final_spires.png 0.10,0.13,0.22,0.0035
../bl/bin/python post.py hi_dunes.png final_dunes.png 0.24,0.17,0.19,0.003
echo done
