cd "$(dirname "$0")"
MW_GAIN=0.08 ../bl/bin/python moon.py sky $PWD/moon_final2 12 4200 > log_sky2.txt 2>&1 && echo sky-ok || echo sky-FAILED
../bl/bin/python moon.py bake $PWD/moon_final2 24 4096 > log_bake2.txt 2>&1 && echo bake-ok || echo bake-FAILED
echo all-done
