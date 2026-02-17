import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceRoot = resolve('contracts/output/CrestronTouchpanel/programming');
const destRoot = resolve('dist/contracts/output/CrestronTouchpanel/programming');

function walk(dir, results = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
      continue;
    }
    if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

if (!existsSync(sourceRoot) || !statSync(sourceRoot).isDirectory()) {
  console.warn('[contract:stage:programming] No generated programming output found.');
  console.warn(`[contract:stage:programming] Expected: ${sourceRoot}`);
  console.warn('[contract:stage:programming] Generate contract outputs in Contract Editor to produce .chd and .g.cs files.');
  process.exit(0);
}

const files = walk(sourceRoot);
const chdFiles = files.filter((file) => file.toLowerCase().endsWith('.chd'));
const gcsFiles = files.filter((file) => file.toLowerCase().endsWith('.g.cs'));

mkdirSync(destRoot, { recursive: true });
cpSync(sourceRoot, destRoot, { recursive: true });

console.log(`[contract:stage:programming] Copied programming output -> ${destRoot}`);
console.log(`[contract:stage:programming] .chd files: ${chdFiles.length}`);
console.log(`[contract:stage:programming] .g.cs files: ${gcsFiles.length}`);

if (!chdFiles.length || !gcsFiles.length) {
  console.warn('[contract:stage:programming] Warning: expected both .chd and .g.cs outputs.');
}
