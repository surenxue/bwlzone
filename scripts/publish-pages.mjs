import { cp, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const cname = (await readFile(path.join(root, 'CNAME'), 'utf8')).trim();
if (new URL(config.origin).hostname !== cname) throw new Error('Site origin must match the existing CNAME.');
for (const script of ['build.mjs', 'check.mjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
await cp(path.join(root, 'dist'), root, { recursive: true });
await writeFile(path.join(root, '.nojekyll'), '');
console.log(`GitHub Pages files ready at repository root for https://${cname}`);
