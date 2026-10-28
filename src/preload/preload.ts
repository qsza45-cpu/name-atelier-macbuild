// Exposes the small IPC surface the renderer needs as window.atelier.
import { contextBridge, ipcRenderer } from 'electron';
import type { AtelierApi } from '../shared/types';

const api: AtelierApi = {
  load: () => ipcRenderer.invoke('store:load'),
  saveFavorites: (list) => ipcRenderer.invoke('store:favorites', list),
  saveSettings: (s) => ipcRenderer.invoke('store:settings', s),
  copy: (text) => ipcRenderer.invoke('clipboard:write', text),
  exportFile: (kind, content, name) => ipcRenderer.invoke('file:export', kind, content, name),
  saveImage: (dataUrl, name) => ipcRenderer.invoke('file:saveImage', dataUrl, name),
  assetDataUrl: (rel) => ipcRenderer.invoke('asset:dataUrl', rel),
  info: () => ipcRenderer.invoke('app:info'),
};

contextBridge.exposeInMainWorld('atelier', api);
