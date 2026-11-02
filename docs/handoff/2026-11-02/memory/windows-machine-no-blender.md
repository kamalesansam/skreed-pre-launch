---
name: windows-machine-no-blender
description: "The Windows machine (since 2026-10-23) has Blender 5.2 at C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe for headless runs, but none of Sam's 2026-10-16 FBX sources; the Blender MCP connector needs its add-on server started; the dev server starts through Git bash"
metadata:
  node_type: memory
  type: project
  originSessionId: 4aecc83b-f76d-4b5d-8424-81f04f311ea5
  modified: 2026-10-26T11:43:45.267Z
---

Blender 5.2.3 LTS is installed at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (a bash `ls` of "Program Files" missed it once; PowerShell `Get-Process`/`Get-ChildItem` found it). Headless runs work: `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python <script> -- <args>`; `bpy.ops.import_scene.fbx` still exists in 5.2. The Blender MCP connector (`mcp__Blender__*`) only works when the add-on's server is started inside Blender (port 9876); on 2026-10-26 Blender was running but the port was closed and every connector call failed.

None of Sam's 2026-10-16 FBX sources (wallet, AirPods case, Lenskin) are on this machine: a search of every drive on 2026-10-26 found only `airpods max.fbx`, `snap 3.fbx` and `ultra.fbx` in Downloads. The cleaned GLBs in `scripts/room/models/` and `products.bin` are the only inputs for those three, so their fixes happen in `products-bin.mjs` or in three (the DoubleSide and logo-role fixes of 2026-10-26); the AirPods case's device parts and a full-detail Lenskin wait for the FBX files. `scripts/room/products-full.py` is the full-detail clean (keeps or re-smooths normals, keeps the device parts).

The npm scripts use `VAR=value` prefixes that cmd.exe cannot read; `.claude/launch.json` has an `astro-dev-win` entry that runs Astro through `C:/Program Files/Git/bin/bash.exe` with `/usr/bin` on PATH (bash spawned by npm lacks coreutils otherwise).

**Why:** Saves searching for Blender and the FBX files, and the failed dev-server starts, next time a section 4 model or render change comes up.

**How to apply:** Headless Blender for any FBX clean; ask Sam for the two missing FBX files (or to start the connector's server with them open in Blender) before promising AirPods device parts or a smoother Lenskin. Start the preview with the `astro-dev-win` launch entry.
