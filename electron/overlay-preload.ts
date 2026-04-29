import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronSnip', {
  captureRegion: (rect: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send('snip:region-selected', rect),
  cancel: () => ipcRenderer.send('snip:canceled'),
});
