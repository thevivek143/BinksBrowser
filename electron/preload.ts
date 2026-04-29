import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

type Listener = (data: unknown) => void;

function on(channel: string, cb: Listener) {
  const handler = (_: IpcRendererEvent, data: unknown) => cb(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigate:   (tabId: string, url: string)  => ipcRenderer.invoke('nav:go',      { tabId, url }),
  goBack:     (tabId: string)               => ipcRenderer.invoke('nav:back',     { tabId }),
  goForward:  (tabId: string)               => ipcRenderer.invoke('nav:forward',  { tabId }),
  reload:     (tabId: string)               => ipcRenderer.invoke('nav:reload',   { tabId }),
  stop:       (tabId: string)               => ipcRenderer.invoke('nav:stop',     { tabId }),

  // Tab management
  newTab:      (tabId: string)              => ipcRenderer.invoke('tab:new',      { tabId }),
  activateTab: (tabId: string)             => ipcRenderer.invoke('tab:activate', { tabId }),
  closeTab:    (tabId: string)             => ipcRenderer.invoke('tab:close',    { tabId }),
  hideTab:     (tabId: string)             => ipcRenderer.invoke('tab:hide',     { tabId }),

  // Window controls
  minimize:   ()                           => ipcRenderer.invoke('win:minimize'),
  maximize:   ()                           => ipcRenderer.invoke('win:maximize'),
  close:      ()                           => ipcRenderer.invoke('win:close'),
  fullscreen: (on: boolean)               => ipcRenderer.invoke('win:fullscreen', { on }),

  // Layout sync
  setSidebarWidth:  (width: number)  => ipcRenderer.invoke('layout:sidebar-width',  { width }),
  setChromeHeight:  (height: number) => ipcRenderer.invoke('layout:chrome-height', { height }),

  // Screenshot — Snipping Tool
  screenshotFullscreen: ()                 => ipcRenderer.invoke('screenshot:fullscreen'),
  screenshotWindow:     (tabId: string)    => ipcRenderer.invoke('screenshot:window', { tabId }),
  screenshotRegion:     ()                 => ipcRenderer.invoke('screenshot:region'),
  screenshotSave:       (base64: string, filename: string) =>
                                              ipcRenderer.invoke('screenshot:save', { base64, filename }),
  screenshotCopy:       (base64: string)   => ipcRenderer.invoke('screenshot:copy', { base64 }),
  screenshotShowFile:   (filePath: string) => ipcRenderer.invoke('screenshot:show-file', { filePath }),

  // Events → renderer (return cleanup fn)
  onTabUpdated:  (cb: Listener) => on('tab:updated',  cb),
  onTabLoading:  (cb: Listener) => on('tab:loading',  cb),
  onTabNavigate: (cb: Listener) => on('tab:navigate', cb),
  onTabError:    (cb: Listener) => on('tab:error',    cb),
  onTabTitle:    (cb: Listener) => on('tab:title',    cb),
  onTabFavicon:  (cb: Listener) => on('tab:favicon',  cb),
  onTabOpenNew:  (cb: Listener) => on('tab:open-new', cb),

  // Meta
  isElectron: true as const,
  platform:   process.platform,
});
