// igloo's labels (prototype lines 1090 to 1154; frame step F10): when blocks part, up to 5 nearby moving blocks get a
// pip and a two-digit readout of how far each has moved, floor(distance x 50), and thin Pearl Whisper links to their two
// nearest. Drawn in over 0.1 s, out over 0.06 s; one block joins or leaves per 0.05 units of pointer travel.
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Quaternion, Vector2, Vector3, type Mesh, type PerspectiveCamera } from 'three';
import type { Block } from '../logo/geometry.ts';
import type { LogoUniforms } from '../logo/uniforms.ts';

const LAB = { max: 5, links: 2, minDisp: 0.1, near: 2, step: 0.05, inT: 0.1, outT: 0.06 };

export interface Labels {
  links: LineSegments;
  update(dt: number, active: boolean, mouse: { x: number; y: number }): void;
  clear(): void;
  dispose(): void;
}

export function createLabels(layer: HTMLElement | null, o: { blocks: Block[]; U: LogoUniforms; logo: Mesh; camA: PerspectiveCamera; depth: number }): Labels {
  const { blocks, U, logo, camA, depth } = o;
  const labs = new Map<number, { el: HTMLDivElement; a: number; on: boolean }>();   // block index -> label
  let labTravel = 0; const labLast = new Vector2(99, 99);
  const linkGeo = new BufferGeometry(); const linkPos = new Float32Array(LAB.max * LAB.links * 2 * 3);
  linkGeo.setAttribute('position', new BufferAttribute(linkPos, 3)); linkGeo.setDrawRange(0, 0);
  const linkMat = new LineBasicMaterial({ color: 0xF7F6F3, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const links = new LineSegments(linkGeo, linkMat); links.renderOrder = 10; links.frustumCulled = false;
  const _lp = new Vector3(), _lq = new Quaternion(), _front = new Vector3();
  function blockPoint(i: number, out: Vector3) {             // the centre of a block's front face, where it is now, in world space
    const b = blocks[i]; _front.set(0, 0, depth / 2);
    _lq.set(U.uQ.value[i].x, U.uQ.value[i].y, U.uQ.value[i].z, U.uQ.value[i].w); _front.applyQuaternion(_lq);
    return out.set(b.c.x, b.c.y, 0).add(U.uOff.value[i]).add(_front).applyMatrix4(logo.matrixWorld);
  }
  function update(dt: number, active: boolean, mouse: { x: number; y: number }) {
    labTravel += Math.hypot(mouse.x - labLast.x, mouse.y - labLast.y); labLast.set(mouse.x, mouse.y);
    const cand: [number, number][] = [];
    if (active) blocks.forEach((b, i) => { const dd = Math.hypot(b.c.x - mouse.x, b.c.y - mouse.y); if (b.d > LAB.minDisp && dd < LAB.near) cand.push([dd, i]); });
    cand.sort((a, b) => a[0] - b[0]); const candSet = new Set(cand.map((c) => c[1]));
    if (!active) labTravel = 0;
    // the first label joins as soon as a block has parted, so a slow or still pointer still gets a readout;
    // after that, igloo's pacing: one block joins or leaves per 0.05 units of pointer travel
    if (active && cand.length && ![...labs.values()].some((l) => l.on)) labTravel = Math.max(labTravel, LAB.step + 1e-6);
    while (labTravel > LAB.step) {
      labTravel -= LAB.step;
      const leaving = [...labs].find(([i, l]) => l.on && !candSet.has(i));
      if (leaving) { leaving[1].on = false; continue; }
      const onCount = [...labs.values()].filter((l) => l.on).length;
      const joining = cand.find(([, i]) => !(labs.get(i) || { on: false }).on);
      if (joining && onCount < LAB.max) {
        const i = joining[1]; let l = labs.get(i);
        if (!l) { const el = document.createElement('div'); el.className = 'lab'; el.append(document.createElement('i'), document.createElement('span')); layer?.appendChild(el); l = { el, a: 0, on: true }; labs.set(i, l); }
        l.on = true;
      }
      if (!leaving && !joining) labTravel = 0;
    }
    if (!active) for (const l of labs.values()) l.on = false;
    // fade, place, number
    const shown: [number, Vector3][] = [];
    for (const [i, l] of labs) {
      if (!blocks[i]) { l.el.remove(); labs.delete(i); continue; }   // the block count changed under this label
      l.a = l.on ? Math.min(1, l.a + dt / LAB.inT) : Math.max(0, l.a - dt / LAB.outT);
      if (l.a <= 0 && !l.on) { l.el.remove(); labs.delete(i); continue; }
      blockPoint(i, _lp); const sp = _lp.clone().project(camA);
      const x = (sp.x * 0.5 + 0.5) * innerWidth, y = (-sp.y * 0.5 + 0.5) * innerHeight;
      const n = Math.floor(U.uOff.value[i].length() * 50) % 100;
      (l.el.lastChild as HTMLElement).textContent = String(n).padStart(2, '0');
      l.el.style.transform = `translate3d(${(x - 1.5).toFixed(1)}px,${(y - 6).toFixed(1)}px,0)`;
      l.el.style.opacity = l.a.toFixed(3);
      if (l.a > 0.5) shown.push([i, _lp.clone()]);
    }
    // links: each shown block to its two nearest shown neighbours
    let k = 0; const seen = new Set<string>();
    for (const [i, p] of shown) {
      const near = shown.filter(([j]) => j !== i).map(([j, q]) => [p.distanceTo(q), j, q] as [number, number, Vector3]).sort((a, b) => a[0] - b[0]).slice(0, LAB.links);
      for (const [, j, q] of near) {
        const key = i < j ? i + ':' + j : j + ':' + i; if (seen.has(key)) continue; seen.add(key);
        linkPos.set([p.x, p.y, p.z, q.x, q.y, q.z], k * 6); k++;
      }
    }
    linkGeo.attributes.position.needsUpdate = true; linkGeo.setDrawRange(0, k * 2);
  }
  return {
    links, update,
    clear() { for (const l of labs.values()) l.el.remove(); labs.clear(); linkGeo.setDrawRange(0, 0); },
    dispose() { linkGeo.dispose(); linkMat.dispose(); },
  };
}
