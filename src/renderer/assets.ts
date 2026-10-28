// Design-asset probe: checks which 이미지개미 files exist in dist/renderer/design and flags them on <html>
// (data-asset-*), so CSS only uses an image when it is really there. Add an entry here for each new asset.
const ASSETS = {
  bg: ['bg_main_light.jpg', 'bg_main_dark.jpg'],
  frame: ['card_frame_light.png', 'card_frame_dark.png'],
  back: ['card_back.png'],
  crest: ['card_crest.png'],
  wordmark: ['logo_wordmark_dark.png', 'logo_wordmark_light.png'],
  symbol: ['logo_symbol.png'],
} as const;

export type AssetKey = keyof typeof ASSETS;
const present = new Set<AssetKey>();
const listeners = new Set<() => void>();

const exists = (file: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `design/${file}`;
  });

export function probeAssets() {
  for (const [key, files] of Object.entries(ASSETS) as [AssetKey, readonly string[]][]) {
    // A themed pair counts only when both files exist, so light and dark never mix art and fallback.
    Promise.all(files.map(exists)).then((ok) => {
      if (!ok.every(Boolean)) return;
      present.add(key);
      document.documentElement.setAttribute(`data-asset-${key}`, '1');
      listeners.forEach((l) => l());
    });
  }
}

export const hasAsset = (k: AssetKey) => present.has(k);
export function onAssets(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}
