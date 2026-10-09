// The WebGL gate the island shares with its boot stub (docs/specs/family-page.md 2.7: "WebGL only through a software
// renderer" lands in swatch grid mode). boot.ts runs it before importing the island or fetching the model, so a device
// that would fall back anyway downloads neither; the stage runs the same test on its own renderer.
export const SOFTWARE_GL = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

/** 'ok', or why the 3D cannot run here: no WebGL2 context ('webgl') or only a software renderer ('software'). */
export function glCheck(force: boolean): 'ok' | 'webgl' | 'software' {
  let gl: WebGL2RenderingContext | null = null;
  try { gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: !force }); } catch { gl = null; }
  if (!gl) return 'webgl';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return !force && SOFTWARE_GL.test(name) ? 'software' : 'ok';
}
