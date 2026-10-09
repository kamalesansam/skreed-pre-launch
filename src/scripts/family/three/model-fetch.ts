// The model fetch (docs/specs/case-model-class.md 4 "Order" and "Retries"): our own fetch with a 20 s timeout, memoised
// per URL for the page's life. A failed load is forgotten, so "Try again" or the `online` event fetches it once more.
// boot.ts starts the LOD1 fetch at the same time as the island chunk's import, so the two downloads overlap; the island
// then finds the same promise here (one module, shared by both chunks).
export class ModelError extends Error {
  readonly reason: 'http' | 'timeout' | 'decode' | 'offline';
  constructor(reason: ModelError['reason'], msg: string) { super(msg); this.reason = reason; }
}

const TIMEOUT_MS = 20_000;
const memo = new Map<string, Promise<ArrayBuffer>>();
export function fetchModel(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  let p = memo.get(url);
  if (!p) {
    p = (async () => {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const stop = () => ac.abort();
      signal?.addEventListener('abort', stop, { once: true });
      try {
        const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
        if (!res.ok) throw new ModelError('http', `${url}: HTTP ${res.status}`);
        return await res.arrayBuffer();
      } catch (e) {
        if (e instanceof ModelError) throw e;
        if (navigator.onLine === false) throw new ModelError('offline', `${url}: offline`);
        throw new ModelError(ac.signal.aborted && !signal?.aborted ? 'timeout' : 'http', `${url}: ${String(e)}`);
      } finally {
        clearTimeout(t);
        signal?.removeEventListener('abort', stop);
      }
    })();
    memo.set(url, p);
    p.catch(() => memo.delete(url));
  }
  return p;
}
export function forgetModel(url?: string): void { if (url) memo.delete(url); else memo.clear(); }

