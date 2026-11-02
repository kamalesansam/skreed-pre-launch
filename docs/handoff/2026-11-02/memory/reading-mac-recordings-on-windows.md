---
name: reading-mac-recordings-on-windows
description: "Sam's macOS screen recordings (.mov, H.264) can be read frame by frame on the Windows machine only through headless Chrome: no ffmpeg, Playwright's ffmpeg decodes only VP8/MJPEG, and the file names carry a narrow no-break space before PM"
metadata:
  node_type: memory
  type: reference
  originSessionId: 1ba80013-0189-4792-916f-6ced411eb685
  modified: 2026-11-02T08:20:06.575Z
---

Seen 2026-11-02 with `Screen Recording 2026-10-26 at 1.15.09 PM.mov` (depth.fyi's takeover, 862 x 850, 25.8 s):
- No `ffmpeg`/`ffprobe` on the PATH, no OpenCV, PyAV or imageio in Python. Playwright's own `ms-playwright/ffmpeg-1011/ffmpeg-win64.exe` has only the MJPEG and VP8 decoders and no mov demuxer.
- The installed Chrome decodes H.264 in a QuickTime container: serve the file from a tiny node http server (range requests, `content-type: video/mp4`), open a page with a `<video>` in headless Playwright Chrome (`channel: 'chrome'`), seek with `currentTime` and wait for `seeked`, draw to a canvas and save `toDataURL('image/jpeg')`. Same origin, so the canvas is not tainted. A script of this shape and a sharp contact-sheet script took about a minute for 52 frames.
- macOS writes U+202F (narrow no-break space) before "PM" in recording names: a typed path fails with "No such file"; glob it (`Screen\ Recording\ 2026-10-26*`) or copy it to a plain name first.
- Check the codec without a decoder: grep the first 400 KB for `avc1` / `hvc1` atoms.

Related: [[windows-3d-review-with-playwright-chrome]] for the Chrome launch flags.
