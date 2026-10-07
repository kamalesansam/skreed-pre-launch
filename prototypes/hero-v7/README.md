# Hero prototype v7: real 3D moon ground under a Milky Way sky (2026-10-07)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 9). Opens on the Moon world.

- **Ground is real geometry now.** `blender/moon.py bake` builds the lunar floor (1024 x 1024 regolith mesh with gentle valleys, rock outcrops, about 1,900 faceted half-buried stones), lights it in Cycles (hard white key, faint fill), and bakes the lighting into a 4096 texture for the ground and vertex colours for the stones. A lighter 400 x 320 ground grid with the same UVs plus the stones are exported as one Draco glTF (`assets/moon.glb`, 1.2 MB). In the page they use unlit materials with the baked light, so the scroll pull-back has true parallax and the near ground stays sharp.
- **Sky is its own dome.** `blender/moon.py sky` renders a 140 x 70 degree equirectangular sky (4200 px): a coloured Milky Way rising from the horizon with a bright core at its base, dust lanes, dense star layers with star colour temperatures, a few big bright stars, and three small planets (rust, slate teal, a pale ringed one). It is wrapped on a dome that travels with the camera.
- **Framing:** the moon camera sits lower (y -2.5, z 24) and looks slightly up, so the horizon is low and the sky fills most of the frame; the logo floats about 1.3 units above the ground.
- Labels, glow, hover and the wipe are unchanged.

Sizes in the page: sky 1.3 MB, ground texture 0.4 MB, model 1.2 MB (embedded as data URIs for the prototype; on the site they load as separate files behind the poster).
