import { createRoot } from 'react-dom/client';
import { App } from './App';
import { probeAssets } from './assets';
import { renderShareImage } from './shareImage';

probeAssets();
// Dev screenshot runs only (?test=1 is set by the main process when NAME_ATELIER_SHOT is used outside packaged builds).
if (new URLSearchParams(location.search).get('test') === '1') (window as any).__test = { renderShareImage: (cards: any, dark: boolean) => renderShareImage(window.atelier, cards, dark) };
createRoot(document.getElementById('root')!).render(<App />);
