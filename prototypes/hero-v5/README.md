# Hero prototype v5: Blender landscapes at night (2026-10-07)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 6). Tune → World: Canyon, Spires, Dunes. `?world=` and `&blocks=` work as before.

The background is no longer built from code primitives. Each landscape is rendered in Blender 5.0 (Cycles), run headless in the session (`pip install bpy`):

1. `blender/terrain.py`: a 1024 x 1024 heightmap per world, domain-warped fractal noise (terraced strata for the canyon, ridged noise for the spires, wind dunes plus a distant range for the dunes), then 350,000 droplets of hydraulic erosion (numba). Erosion is what gives the gullies, fans and softened ridges.
2. `blender/scene.py`: the heightmap becomes a 512 x 512 mesh (420 units square) with a valley carved around the viewpoint; displacement for low swales; a material with strata by height, sand or snow on the flats, rock on slopes, wind ripples and grain as bump; about 650 eroded boulders; a physical sky (multiple scattering) with the sun just below the horizon (twilight), a star field, a low warm key light and a cool fill; a planet (banded, ringed for canyon and dunes) placed right of the logo. Rendered as an equirectangular plate, 100 x 60 degrees from the hero camera, 2600 x 1560, 32 samples, OpenImageDenoise. A second one-sample pass renders view distance.
3. `blender/post.py`: aerial perspective from that depth pass (haze by distance, sky left untouched).

In the page the plate is wrapped on the inside of a sphere segment around the camera (pitched 6 degrees so the horizon sits low), so the logo, hover, glow and the wipe all stay live WebGL in front of it. Plates are WebP, 41 to 70 KB each.

`render_all.sh` re-renders all three (about 10 to 15 minutes on 4 CPU cores).

Next, once a world is chosen: export the near terrain and boulders as a real mesh with baked lighting (glTF + one baked texture) so the scroll pull-back has true parallax, and keep the plate for the far distance and sky.
