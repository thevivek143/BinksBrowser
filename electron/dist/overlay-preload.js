"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronSnip', {
    captureRegion: (rect) => electron_1.ipcRenderer.send('snip:region-selected', rect),
    cancel: () => electron_1.ipcRenderer.send('snip:canceled'),
});
//# sourceMappingURL=overlay-preload.js.map