import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('contracts/output/CrestronTouchpanel/interface/mapping/CrestronTouchpanel.cse2j');
const destination = resolve('config/contract.cse2j');

if (!existsSync(source)) {
  console.error(`[contract:sync] Missing generated contract file: ${source}`);
  process.exit(1);
}

try {
  JSON.parse(readFileSync(source, 'utf8'));
} catch (error) {
  console.error(`[contract:sync] Invalid JSON in ${source}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log(`[contract:sync] Copied ${source} -> ${destination}`);
