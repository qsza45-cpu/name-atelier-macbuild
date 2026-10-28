// Admin tool IPC surface (window.keygen).
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('keygen', {
  status: () => ipcRenderer.invoke('key:status'),
  create: () => ipcRenderer.invoke('key:create'),
  importBackup: () => ipcRenderer.invoke('key:import'),
  backup: () => ipcRenderer.invoke('key:backup'),
  issue: (count: number) => ipcRenderer.invoke('keys:issue', count),
  copy: (text: string) => ipcRenderer.invoke('keys:copy', text),
  exportKeys: (kind: 'txt' | 'csv', keys: unknown[]) => ipcRenderer.invoke('keys:export', kind, keys),
  folder: () => ipcRenderer.invoke('app:folder'),
});
