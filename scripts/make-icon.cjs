// Renders the app icon PNGs and the Windows .ico from an SVG (default: the temporary code-drawn icon).
// When 이미지개미 delivers app_icon_1024.png, run with the PNG path instead:  npx electron scripts/make-icon.cjs path/to/app_icon_1024.png
// Output: assets/icon/app_icon_{16,32,48,256,512,1024}.png + app_icon.ico. (.icns is made on macOS: see docs/BUILD.md.)
const { app, BrowserWindow, nativeImage } = require('electron');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const root = join(__dirname, '..');
const outDir = join(root, 'assets/icon');
const src = process.argv.find((a) => /\.(png|svg)$/i.test(a));

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2340"/><stop offset="1" stop-color="#1e1724"/></linearGradient></defs>
<rect x="100" y="100" width="824" height="824" rx="185" fill="url(#g)"/>
<rect x="128" y="128" width="768" height="768" rx="160" fill="none" stroke="#d6b46e" stroke-width="6" opacity=".55"/>
<circle cx="512" cy="540" r="230" fill="#7b2d4a"/><circle cx="512" cy="540" r="230" fill="none" stroke="#d6b46e" stroke-width="14"/>
<path d="M512 360 L590 520 Q600 545 585 570 L540 650 L512 700 L484 650 L439 570 Q424 545 434 520 Z" fill="#f2eadf"/>
<path d="M512 470 L512 640" stroke="#7b2d4a" stroke-width="14" stroke-linecap="round"/><circle cx="512" cy="470" r="20" fill="#7b2d4a"/>
<path d="M512 220 l14 34 34 14 -34 14 -14 34 -14 -34 -34 -14 34 -14z" fill="#d6b46e"/>
</svg>`;

function ico(pngs) {
  // ICO with embedded PNG entries (supported since Windows Vista).
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

app.whenReady().then(async () => {
  mkdirSync(outDir, { recursive: true });
  let master;
  if (src && /\.png$/i.test(src)) {
    master = nativeImage.createFromPath(resolve(src));
  } else {
    const svg = src ? readFileSync(resolve(src), 'utf8') : PLACEHOLDER;
    const win = new BrowserWindow({ width: 1024, height: 1024, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
    await win.loadURL(`data:text/html,<html><body style="margin:0;background:transparent">${encodeURIComponent(svg.replace('<svg ', '<svg width="1024" height="1024" '))}</body></html>`);
    await new Promise((r) => setTimeout(r, 300));
    master = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  }
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const pngs = [];
  // Hand-drawn small sizes (app_icon_16/32/48.png next to the source PNG) win over downscaled ones.
  const srcDir = src && /\.png$/i.test(src) ? require('node:path').dirname(resolve(src)) : null;
  const dedicated = (size) => {
    const f = srcDir && join(srcDir, `app_icon_${size}.png`);
    return f && require('node:fs').existsSync(f) ? readFileSync(f) : null;
  };
  for (const size of sizes) {
    const buf = dedicated(size) ?? master.resize({ width: size, height: size, quality: 'best' }).toPNG();
    if ([16, 32, 48, 256, 512, 1024].includes(size)) writeFileSync(join(outDir, `app_icon_${size}.png`), buf);
    if (size <= 256) pngs.push({ size, buf });
  }
  writeFileSync(join(outDir, 'app_icon.ico'), ico(pngs));
  console.log('icons written to assets/icon');
  app.quit();
});
