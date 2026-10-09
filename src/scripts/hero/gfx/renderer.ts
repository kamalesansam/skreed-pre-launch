// The renderer (prototype lines 320 to 328; hero-architecture.md 5.3 step 3). antialias true for parity,
// failIfMajorPerformanceCaveat unless the test override forced the 3D tier. A construction failure throws, which the
// boot routes to the poster (hard failure, D19). setPixelRatio runs here, before any composer copies the ratio.
import { ACESFilmicToneMapping, WebGLRenderer, type WebGLRendererParameters } from 'three';
import { DPR_CAP } from '../../../config/hero.ts';

export interface RendererOptions { touch: boolean; forced: boolean; extra?: Partial<WebGLRendererParameters> }

export function createRenderer(canvas: HTMLCanvasElement, o: RendererOptions): { renderer: WebGLRenderer; dpr: number } {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !o.forced, ...o.extra });
  const dpr = Math.min(devicePixelRatio, o.touch ? DPR_CAP.touch : DPR_CAP.fine);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.autoClear = true;
  return { renderer, dpr };
}
