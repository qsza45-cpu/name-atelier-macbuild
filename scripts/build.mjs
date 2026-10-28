// Bundles main, preload and renderer with esbuild into dist/, and copies fonts and design assets.
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'renderer'), { recursive: true });

const common = { bundle: true, sourcemap: true, logLevel: 'warning', absWorkingDir: root };

await Promise.all([
  build({ ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main.js', platform: 'node', format: 'cjs', target: 'node22', external: ['electron'] }),
  build({ ...common, entryPoints: ['src/preload/preload.ts'], outfile: 'dist/preload.js', platform: 'node', format: 'cjs', target: 'node22', external: ['electron'] }),
  build({
    ...common,
    entryPoints: ['src/renderer/main.tsx'],
    outfile: 'dist/renderer/app.js',
    platform: 'browser',
    format: 'iife',
    target: 'chrome138',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
  }),
]);

cpSync(join(root, 'src/renderer/index.html'), join(dist, 'renderer/index.html'));
cpSync(join(root, 'src/renderer/styles'), join(dist, 'renderer/styles'), { recursive: true });
cpSync(join(root, 'assets/fonts'), join(dist, 'renderer/fonts'), { recursive: true });
// Design assets from 이미지개미 (assets/design). Missing files are fine: the CSS falls back to code-drawn styles.
mkdirSync(join(dist, 'renderer/design'), { recursive: true });
for (const f of existsSync(join(root, 'assets/design')) ? readdirSync(join(root, 'assets/design')) : []) {
  if (/\.(png|jpg|jpeg|svg|webp)$/i.test(f)) cpSync(join(root, 'assets/design', f), join(dist, 'renderer/design', f));
}
// PLOTIVE official logo (approved A Editorial Monogram), used only on shared card images.
if (existsSync(join(root, 'assets/partner'))) cpSync(join(root, 'assets/partner'), join(dist, 'renderer/partner'), { recursive: true });
if (existsSync(join(root, 'assets/icon/app_icon_256.png'))) {
  mkdirSync(join(dist, 'icon'), { recursive: true });
  cpSync(join(root, 'assets/icon/app_icon_256.png'), join(dist, 'icon/app_icon_256.png'));
}
if (existsSync(join(root, 'assets/licenses'))) cpSync(join(root, 'assets/licenses'), join(dist, 'renderer/licenses'), { recursive: true });
console.log('NAME ATELIER built → dist/');
