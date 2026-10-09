// usage: node sizes.mjs file...  -> raw, gzip -9, brotli q11 (bytes)
import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path';
const rows = [];
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f);
  const gz = zlib.gzipSync(b, { level: 9 }).length;
  const br = zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: b.length } }).length;
  rows.push([path.basename(f), b.length, gz, br]);
}
const k = (n) => (n / 1024).toFixed(1);
console.log('file | raw B | raw KB | gzip9 KB | br11 KB');
for (const [n, r, g, br] of rows) console.log(`${n} | ${r} | ${k(r)} | ${k(g)} | ${k(br)}`);
const t = rows.reduce((a, r) => [a[0] + r[1], a[1] + r[2], a[2] + r[3]], [0, 0, 0]);
console.log(`TOTAL | ${t[0]} | ${k(t[0])} | ${k(t[1])} | ${k(t[2])}`);
