// Binary fetches (hero-architecture.md 6.2, 6.3). Stage 1 fetches the prototype's raw files; stage 2 packs them with
// gzip (and ground_h with planar prediction) and inflates them here through DecompressionStream (spec D22).

/** Fetches a binary; a network error or a non-2xx status rejects, which the boot routes to the poster (D19). */
export async function fetchBin(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.arrayBuffer();
}

/** Fetches and parses a JSON data file (pieces.json is data, not bundled; architecture 6.3). */
export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}
