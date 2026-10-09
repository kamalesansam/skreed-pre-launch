// A task boundary, so the loader's frame paints between build chunks (prototype line 277).
export const yieldFrame = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
