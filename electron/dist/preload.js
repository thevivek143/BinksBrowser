"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function on(channel, cb) {
    const handler = (_, data) => cb(data);
    electron_1.ipcRenderer.on(channel, handler);
    return () => electron_1.ipcRenderer.removeListener(channel, handler);
}
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Navigation
    navigate: (tabId, url) => electron_1.ipcRenderer.invoke('nav:go', { tabId, url }),
    goBack: (tabId) => electron_1.ipcRenderer.invoke('nav:back', { tabId }),
    goForward: (tabId) => electron_1.ipcRenderer.invoke('nav:forward', { tabId }),
    reload: (tabId) => electron_1.ipcRenderer.invoke('nav:reload', { tabId }),
    stop: (tabId) => electron_1.ipcRenderer.invoke('nav:stop', { tabId }),
    // Tab management
    newTab: (tabId) => electron_1.ipcRenderer.invoke('tab:new', { tabId }),
    activateTab: (tabId) => electron_1.ipcRenderer.invoke('tab:activate', { tabId }),
    closeTab: (tabId) => electron_1.ipcRenderer.invoke('tab:close', { tabId }),
    hideTab: (tabId) => electron_1.ipcRenderer.invoke('tab:hide', { tabId }),
    // Window controls
    minimize: () => electron_1.ipcRenderer.invoke('win:minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('win:maximize'),
    close: () => electron_1.ipcRenderer.invoke('win:close'),
    fullscreen: (on) => electron_1.ipcRenderer.invoke('win:fullscreen', { on }),
    // Layout sync
    setSidebarWidth: (width) => electron_1.ipcRenderer.invoke('layout:sidebar-width', { width }),
    setChromeHeight: (height) => electron_1.ipcRenderer.invoke('layout:chrome-height', { height }),
    // Screenshot — Snipping Tool
    screenshotFullscreen: () => electron_1.ipcRenderer.invoke('screenshot:fullscreen'),
    screenshotWindow: (tabId) => electron_1.ipcRenderer.invoke('screenshot:window', { tabId }),
    screenshotRegion: () => electron_1.ipcRenderer.invoke('screenshot:region'),
    screenshotSave: (base64, filename) => electron_1.ipcRenderer.invoke('screenshot:save', { base64, filename }),
    screenshotCopy: (base64) => electron_1.ipcRenderer.invoke('screenshot:copy', { base64 }),
    screenshotShowFile: (filePath) => electron_1.ipcRenderer.invoke('screenshot:show-file', { filePath }),
    // Events → renderer (return cleanup fn)
    onTabUpdated: (cb) => on('tab:updated', cb),
    onTabLoading: (cb) => on('tab:loading', cb),
    onTabNavigate: (cb) => on('tab:navigate', cb),
    onTabError: (cb) => on('tab:error', cb),
    onTabTitle: (cb) => on('tab:title', cb),
    onTabFavicon: (cb) => on('tab:favicon', cb),
    onTabOpenNew: (cb) => on('tab:open-new', cb),
    // Meta
    isElectron: true,
    platform: process.platform,
});
//# sourceMappingURL=preload.js.map