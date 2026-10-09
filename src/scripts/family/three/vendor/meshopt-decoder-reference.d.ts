// Types for meshopt-decoder-reference.js, meshoptimizer 0.22.0's pure-JavaScript reference decoder, vendored byte for
// byte from the npm tarball (meshoptimizer-0.22.0.tgz, integrity sha512-IebiK79sqIy+E4EgOr+CAw+Ke8hAspXKzBd0JdgEmPHiAwmvEj2S4h1rfvo+o/BnfEYd/jAOg5IeeIjzlzSnDg==;
// file sha256 66b9856b46d4e3bdaa822c7defb3e6ab0edb2ca372f8460f6ad5742294019616), MIT licence in LICENSE.meshoptimizer.md.
// Why this one (docs/specs/family-page.md decision 16, case-model-class.md amendment 1): it compiles no WebAssembly, so
// it decodes EXT_meshopt_compression under the site CSP, which has no 'wasm-unsafe-eval'. three's MeshoptDecoder
// compiles WebAssembly and must never be imported. tests/case-model/intake.test.ts pins the file's hash.
export declare const MeshoptDecoder: {
  supported: boolean;
  ready: Promise<void>;
  decodeVertexBuffer(target: Uint8Array, count: number, size: number, source: Uint8Array, filter?: string): void;
  decodeIndexBuffer(target: Uint8Array, count: number, size: number, source: Uint8Array): void;
  decodeIndexSequence(target: Uint8Array, count: number, size: number, source: Uint8Array): void;
  decodeGltfBuffer(target: Uint8Array, count: number, size: number, source: Uint8Array, mode: string, filter?: string): void;
};
