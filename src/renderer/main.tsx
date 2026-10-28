import { createRoot } from 'react-dom/client';
import { App } from './App';
import { probeAssets } from './assets';

probeAssets();
createRoot(document.getElementById('root')!).render(<App />);
