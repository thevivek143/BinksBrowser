"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const adblocker_electron_1 = require("@ghostery/adblocker-electron");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const isDev = !electron_1.app.isPackaged;
const ROOT_DIR = electron_1.app.getAppPath();
if (electron_1.app.isPackaged) {
    const noop = () => { };
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
}
// Layout constants (must match CSS exactly)
// CHROME_HEIGHT breakdown:
//   TabBar:        min-height: 44px
//   toolbarRow:    padding 8px*2 + AddressBar 38px = 54px
//   BookmarksBar:  items 30px + border 1px = 31px
//   Total:         129px
const CHROME_HEIGHT = 129;
const SIDEBAR_WIDTH = 0; // sidebar fully hidden when collapsed (0px)
// Chrome 135 UA — hides Electron so YouTube/Google load
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/135.0.0.0 Safari/537.36';
let mainWindow = null;
const tabViews = new Map();
let activeTabId = null;
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function getErrorCode(error) {
    return typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : undefined;
}
// ─── Session hardening ────────────────────────────────────────────────────────
function configureSession(ses) {
    ses.setUserAgent(CHROME_UA);
    ses.webRequest.onHeadersReceived((details, callback) => {
        const h = {};
        for (const [key, val] of Object.entries(details.responseHeaders ?? {})) {
            const lower = key.toLowerCase();
            if (lower === 'x-frame-options')
                continue;
            if (lower === 'content-security-policy') {
                const cleaned = (Array.isArray(val) ? val : [val])
                    .map(v => v.replace(/frame-ancestors[^;]*(;|$)/gi, '').trim())
                    .filter(Boolean);
                if (cleaned.length)
                    h[key] = cleaned;
                continue;
            }
            h[key] = Array.isArray(val) ? val : [val];
        }
        callback({ responseHeaders: h });
    });
}
// ─── Window creation ──────────────────────────────────────────────────────────
async function createWindow() {
    const tabSession = electron_1.session.fromPartition('persist:tabs', { cache: true });
    configureSession(tabSession);
    configureSession(electron_1.session.defaultSession);
    try {
        const blocker = await adblocker_electron_1.ElectronBlocker.fromPrebuiltAdsAndTracking(cross_fetch_1.default);
        blocker.enableBlockingInSession(tabSession);
        blocker.enableBlockingInSession(electron_1.session.defaultSession);
        console.log('[AdBlocker] Enabled successfully');
    }
    catch (err) {
        console.error('[AdBlocker] Failed to initialize:', err);
    }
    mainWindow = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0A0A0F',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            spellcheck: true,
        },
        icon: path.join(ROOT_DIR, 'public/icon.png'),
    });
    if (isDev) {
        await mainWindow.loadURL('http://localhost:3000/browser');
    }
    else {
        await mainWindow.loadURL('app://-/browser/index.html');
    }
    mainWindow.on('resize', repositionActiveView);
    mainWindow.on('closed', () => { mainWindow = null; });
}
// ─── View positioning ─────────────────────────────────────────────────────────
// getViewBounds() defined below in ─── IPC: Layout sync ─── section
// Uses dynamic currentSidebarWidth updated on sidebar collapse/expand
function repositionActiveView() {
    if (!activeTabId)
        return;
    const view = tabViews.get(activeTabId);
    const bounds = getViewBounds();
    if (view && bounds)
        view.setBounds(bounds);
}
// ─── Tab view factory ─────────────────────────────────────────────────────────
function createTabView(tabId) {
    const tabSession = electron_1.session.fromPartition('persist:tabs', { cache: true });
    const view = new electron_1.WebContentsView({
        webPreferences: {
            session: tabSession,
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            javascript: true,
            images: true,
        },
    });
    view.webContents.setUserAgent(CHROME_UA);
    const wc = view.webContents;
    wc.on('did-start-loading', () => send('tab:loading', { tabId, loading: true, progress: 15 }));
    wc.on('did-navigate', (_, url) => send('tab:navigate', {
        tabId, url,
        canGoBack: wc.navigationHistory.canGoBack(),
        canGoForward: wc.navigationHistory.canGoForward(),
    }));
    wc.on('did-finish-load', () => {
        const url = wc.getURL();
        try {
            send('tab:updated', {
                tabId, url,
                title: wc.getTitle(),
                favicon: `https://www.google.com/s2/favicons?sz=32&domain=${new URL(url).hostname}`,
                loading: false, progress: 100,
                canGoBack: wc.navigationHistory.canGoBack(),
                canGoForward: wc.navigationHistory.canGoForward(),
            });
        }
        catch { /* invalid URL */ }
    });
    wc.on('did-fail-load', (_, code, desc, url, isMain) => {
        if (isMain && code !== -3)
            send('tab:error', { tabId, code, desc, url });
    });
    wc.on('page-title-updated', (_, title) => send('tab:title', { tabId, title }));
    wc.on('page-favicon-updated', (_, favicons) => {
        if (favicons[0])
            send('tab:favicon', { tabId, favicon: favicons[0] });
    });
    wc.setWindowOpenHandler(({ url }) => {
        send('tab:open-new', { url });
        return { action: 'deny' };
    });
    tabViews.set(tabId, view);
    return view;
}
function send(channel, data) {
    mainWindow?.webContents.send(channel, data);
}
// ─── IPC: Navigation ──────────────────────────────────────────────────────────
electron_1.ipcMain.handle('nav:go', async (_, { tabId, url: rawUrl }) => {
    let view = tabViews.get(tabId);
    if (!view)
        view = createTabView(tabId);
    if (activeTabId === tabId && mainWindow) {
        try {
            mainWindow.contentView.addChildView(view);
        }
        catch { }
        repositionActiveView(); // always reposition before loading
    }
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
        await view.webContents.loadURL(normalized);
    }
    catch (err) {
        if (getErrorCode(err) !== 'ERR_ABORTED')
            console.error('[nav:go]', getErrorMessage(err));
    }
});
electron_1.ipcMain.handle('nav:back', (_, { tabId }) => {
    const v = tabViews.get(tabId);
    if (v?.webContents.navigationHistory.canGoBack())
        v.webContents.navigationHistory.goBack();
});
electron_1.ipcMain.handle('nav:forward', (_, { tabId }) => {
    const v = tabViews.get(tabId);
    if (v?.webContents.navigationHistory.canGoForward())
        v.webContents.navigationHistory.goForward();
});
electron_1.ipcMain.handle('nav:reload', (_, { tabId }) => tabViews.get(tabId)?.webContents.reload());
electron_1.ipcMain.handle('nav:stop', (_, { tabId }) => tabViews.get(tabId)?.webContents.stop());
// ─── IPC: Tabs ────────────────────────────────────────────────────────────────
electron_1.ipcMain.handle('tab:activate', (_, { tabId }) => {
    if (!mainWindow)
        return;
    const prevTabId = activeTabId;
    activeTabId = tabId === 'none' ? null : tabId;
    // Remove ALL child views first
    tabViews.forEach((v) => {
        try {
            mainWindow.contentView.removeChildView(v);
        }
        catch { }
    });
    if (activeTabId) {
        const view = tabViews.get(activeTabId);
        if (view) {
            try {
                mainWindow.contentView.addChildView(view);
            }
            catch { }
            repositionActiveView();
        }
    }
});
electron_1.ipcMain.handle('tab:new', (_, { tabId }) => {
    createTabView(tabId);
});
electron_1.ipcMain.handle('tab:close', (_, { tabId }) => {
    const view = tabViews.get(tabId);
    if (view && mainWindow) {
        mainWindow.contentView.removeChildView(view);
        view.webContents.close({ waitForBeforeUnload: false });
        tabViews.delete(tabId);
        if (activeTabId === tabId)
            activeTabId = null;
    }
});
electron_1.ipcMain.handle('tab:hide', (_, { tabId }) => {
    const view = tabViews.get(tabId);
    if (view && mainWindow) {
        try {
            mainWindow.contentView.removeChildView(view);
        }
        catch { }
    }
});
// ─── IPC: Layout sync ────────────────────────────────────────────────────────
// Called whenever the sidebar collapses or expands so the WebContentsView
// reflows to fill the correct region.
let currentSidebarWidth = SIDEBAR_WIDTH;
electron_1.ipcMain.handle('layout:sidebar-width', (_, { width }) => {
    currentSidebarWidth = width;
    repositionActiveView();
});
function getViewBounds() {
    if (!mainWindow)
        return null;
    const [w, h] = mainWindow.getContentSize();
    return {
        x: currentSidebarWidth,
        y: currentChromeHeight,
        width: Math.max(w - currentSidebarWidth, 0),
        height: Math.max(h - currentChromeHeight, 0),
    };
}
let currentChromeHeight = CHROME_HEIGHT;
electron_1.ipcMain.handle('layout:chrome-height', (_, { height }) => {
    if (height > 0 && height < 300) {
        currentChromeHeight = height;
        repositionActiveView();
    }
});
// ─── IPC: Window controls ─────────────────────────────────────────────────────
electron_1.ipcMain.handle('win:minimize', () => mainWindow?.minimize());
electron_1.ipcMain.handle('win:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
electron_1.ipcMain.handle('win:close', () => mainWindow?.close());
electron_1.ipcMain.handle('win:fullscreen', (_, { on }) => mainWindow?.setFullScreen(on));
// ─── IPC: Screenshot — Snipping Tool ─────────────────────────────────────────
/** Helper: get primary display scale factor */
function primaryDisplay() {
    return electron_1.screen.getPrimaryDisplay();
}
/** Capture full desktop screen */
electron_1.ipcMain.handle('screenshot:fullscreen', async () => {
    const disp = primaryDisplay();
    const sf = disp.scaleFactor;
    const w = Math.round(disp.size.width * sf);
    const h = Math.round(disp.size.height * sf);
    // Hide main window briefly so it doesn't appear in the shot
    mainWindow?.hide();
    await new Promise(r => setTimeout(r, 200));
    const sources = await electron_1.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: w, height: h },
    });
    mainWindow?.show();
    mainWindow?.focus();
    const src = sources.find(s => s.display_id === String(disp.id)) ?? sources[0];
    if (!src)
        return { error: 'No screen source' };
    return { success: true, base64: src.thumbnail.toDataURL() };
});
/** Capture active tab's WebContentsView (or full browser window) */
electron_1.ipcMain.handle('screenshot:window', async (_, { tabId }) => {
    const view = tabViews.get(tabId);
    if (view) {
        const img = await view.webContents.capturePage();
        return { success: true, base64: img.toDataURL() };
    }
    if (mainWindow) {
        const img = await mainWindow.capturePage();
        return { success: true, base64: img.toDataURL() };
    }
    return { error: 'No window available' };
});
/** Open transparent region-selector overlay; returns cropped base64 */
electron_1.ipcMain.handle('screenshot:region', async () => {
    const disp = primaryDisplay();
    const sf = disp.scaleFactor;
    const { width: sw, height: sh } = disp.size;
    // 1. Capture the full screen BEFORE showing the overlay (so overlay isn't in shot)
    const sources = await electron_1.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: Math.round(sw * sf), height: Math.round(sh * sf) },
    });
    const fullImg = (sources.find(s => s.display_id === String(disp.id)) ?? sources[0])?.thumbnail;
    if (!fullImg)
        return { error: 'Could not capture screen' };
    return new Promise(resolve => {
        // 2. Open transparent overlay window
        const overlayWin = new electron_1.BrowserWindow({
            x: disp.bounds.x,
            y: disp.bounds.y,
            width: disp.bounds.width,
            height: disp.bounds.height,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            fullscreen: true,
            webPreferences: {
                preload: path.join(__dirname, 'overlay-preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        overlayWin.loadFile(path.join(ROOT_DIR, 'public/snip-overlay.html'));
        // 3. Region selected — crop the pre-captured full image
        const onSelected = (_, rect) => {
            cleanup();
            try {
                const cropped = fullImg.crop({
                    x: Math.round(rect.x * sf),
                    y: Math.round(rect.y * sf),
                    width: Math.max(1, Math.round(rect.width * sf)),
                    height: Math.max(1, Math.round(rect.height * sf)),
                });
                resolve({ success: true, base64: cropped.toDataURL(), copyOnly: !!rect.copyOnly });
            }
            catch (e) {
                resolve({ error: getErrorMessage(e) });
            }
        };
        const onCanceled = () => { cleanup(); resolve({ canceled: true }); };
        const cleanup = () => {
            electron_1.ipcMain.removeListener('snip:region-selected', onSelected);
            electron_1.ipcMain.removeListener('snip:canceled', onCanceled);
            if (!overlayWin.isDestroyed())
                overlayWin.close();
        };
        electron_1.ipcMain.once('snip:region-selected', onSelected);
        electron_1.ipcMain.once('snip:canceled', onCanceled);
    });
});
/** Save a base64 PNG to disk via native save dialog */
electron_1.ipcMain.handle('screenshot:save', async (_, { base64, filename, }) => {
    const picsDir = electron_1.app.getPath('pictures');
    const { canceled, filePath } = await electron_1.dialog.showSaveDialog(mainWindow, {
        title: 'Save Screenshot',
        defaultPath: path.join(picsDir, filename),
        filters: [
            { name: 'PNG Image', extensions: ['png'] },
            { name: 'JPEG Image', extensions: ['jpg'] },
        ],
    });
    if (canceled || !filePath)
        return { canceled: true };
    // Strip data-URL header and write raw buffer
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    return { success: true, filePath };
});
/** Copy a base64 image to the system clipboard */
electron_1.ipcMain.handle('screenshot:copy', async (_, { base64 }) => {
    const { nativeImage } = await Promise.resolve().then(() => __importStar(require('electron')));
    const img = nativeImage.createFromDataURL(base64);
    electron_1.clipboard.writeImage(img);
    return { success: true };
});
/** Reveal saved file in Explorer */
electron_1.ipcMain.handle('screenshot:show-file', (_, { filePath }) => electron_1.shell.showItemInFolder(filePath));
// ─── App lifecycle ────────────────────────────────────────────────────────────
electron_1.protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, corsEnabled: true } }
]);
electron_1.app.whenReady().then(() => {
    electron_1.protocol.registerFileProtocol('app', (request, callback) => {
        const urlPath = request.url.replace(/^app:\/\/[^/]*\//, '');
        const absolutePath = path.join(ROOT_DIR, 'out', urlPath);
        console.log(`[Protocol] Requested: ${urlPath} -> Resolved: ${absolutePath}`);
        callback({ path: absolutePath });
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
//# sourceMappingURL=main.js.map