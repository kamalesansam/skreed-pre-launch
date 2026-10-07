cd "$(dirname "$0")"
../bl/bin/python moon.py sky $PWD/moon_final 12 4200 > log_sky.txt 2>&1 && echo sky-ok
../bl/bin/python moon.py bake $PWD/moon_final 24 4096 > log_bake.txt 2>&1 && echo bake-ok
echo all-done
