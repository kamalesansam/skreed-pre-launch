// The logo's ShaderMaterial (prototype lines 414 to 535): matte black blocks lit by a soft key, two kickers and the snow,
// glowing from their cut faces in their shade. The mesh is not frustum-culled.
import { BufferGeometry, Mesh, ShaderMaterial } from 'three';
import { logoVert, logoFrag, type LogoSlots } from './shaders.ts';
import { MAXB } from './geometry.ts';
import type { LogoUniforms } from './uniforms.ts';

export function createLogoMaterial(U: LogoUniforms, slots: LogoSlots = {}): ShaderMaterial {
  return new ShaderMaterial({ uniforms: U, fog: false, vertexShader: logoVert(MAXB, slots), fragmentShader: logoFrag(MAXB, slots) });
}

export function createLogoMesh(material: ShaderMaterial): Mesh {
  const logo = new Mesh(new BufferGeometry(), material);
  logo.frustumCulled = false;
  return logo;
}
