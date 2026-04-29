import {
  app, BrowserWindow, ipcMain, WebContentsView,
  shell, session, dialog, clipboard, desktopCapturer, screen, protocol
} from 'electron';
import * as path from 'path';
import * as fs   from 'fs';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch';

const isDev = !app.isPackaged;
const ROOT_DIR = app.getAppPath();

if (app.isPackaged) {
  const noop = () => {};
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
const CHROME_HEIGHT  = 129;
const SIDEBAR_WIDTH  = 0; // sidebar fully hidden when collapsed (0px)

// Chrome 135 UA — hides Electron so YouTube/Google load
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/135.0.0.0 Safari/537.36';

let mainWindow: BrowserWindow | null = null;
const tabViews   = new Map<string, WebContentsView>();
let activeTabId: string | null = null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

// ─── Session hardening ────────────────────────────────────────────────────────

function configureSession(ses: Electron.Session) {
  ses.setUserAgent(CHROME_UA);

  ses.webRequest.onHeadersReceived((details, callback) => {
    const h: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(details.responseHeaders ?? {})) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options') continue;
      if (lower === 'content-security-policy') {
        const cleaned = (Array.isArray(val) ? val : [val])
          .map(v => v.replace(/frame-ancestors[^;]*(;|$)/gi, '').trim())
          .filter(Boolean);
        if (cleaned.length) h[key] = cleaned;
        continue;
      }
      h[key] = Array.isArray(val) ? val : [val];
    }
    callback({ responseHeaders: h });
  });
}

// ─── Window creation ──────────────────────────────────────────────────────────

async function createWindow() {
  const tabSession = session.fromPartition('persist:tabs', { cache: true });
  configureSession(tabSession);
  configureSession(session.defaultSession);

  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(tabSession);
    blocker.enableBlockingInSession(session.defaultSession);
    console.log('[AdBlocker] Enabled successfully');
  } catch (err) {
    console.error('[AdBlocker] Failed to initialize:', err);
  }

  mainWindow = new BrowserWindow({
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
  } else {
    await mainWindow.loadURL('app://-/browser/index.html');
  }

  mainWindow.on('resize', repositionActiveView);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── View positioning ─────────────────────────────────────────────────────────

// getViewBounds() defined below in ─── IPC: Layout sync ─── section
// Uses dynamic currentSidebarWidth updated on sidebar collapse/expand

function repositionActiveView() {
  if (!activeTabId) return;
  const view = tabViews.get(activeTabId);
  const bounds = getViewBounds();
  if (view && bounds) view.setBounds(bounds);
}

// ─── Tab view factory ─────────────────────────────────────────────────────────

function createTabView(tabId: string): WebContentsView {
  const tabSession = session.fromPartition('persist:tabs', { cache: true });

  const view = new WebContentsView({
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

  wc.on('did-start-loading', () =>
    send('tab:loading', { tabId, loading: true, progress: 15 }));

  wc.on('did-navigate', (_, url) =>
    send('tab:navigate', {
      tabId, url,
      canGoBack:    wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
    }));

  wc.on('did-finish-load', () => {
    const url = wc.getURL();
    try {
      send('tab:updated', {
        tabId, url,
        title:   wc.getTitle(),
        favicon: `https://www.google.com/s2/favicons?sz=32&domain=${new URL(url).hostname}`,
        loading: false, progress: 100,
        canGoBack:    wc.navigationHistory.canGoBack(),
        canGoForward: wc.navigationHistory.canGoForward(),
      });
    } catch { /* invalid URL */ }
  });

  wc.on('did-fail-load', (_, code, desc, url, isMain) => {
    if (isMain && code !== -3)
      send('tab:error', { tabId, code, desc, url });
  });

  wc.on('page-title-updated',   (_, title)    => send('tab:title',   { tabId, title }));
  wc.on('page-favicon-updated', (_, favicons) => {
    if (favicons[0]) send('tab:favicon', { tabId, favicon: favicons[0] });
  });

  wc.setWindowOpenHandler(({ url }) => {
    send('tab:open-new', { url });
    return { action: 'deny' };
  });

  tabViews.set(tabId, view);
  return view;
}

function send(channel: string, data: unknown) {
  mainWindow?.webContents.send(channel, data);
}

// ─── IPC: Navigation ──────────────────────────────────────────────────────────

ipcMain.handle('nav:go', async (_, { tabId, url: rawUrl }: { tabId: string; url: string }) => {
  let view = tabViews.get(tabId);
  if (!view) view = createTabView(tabId);

  if (activeTabId === tabId && mainWindow) {
    try { mainWindow.contentView.addChildView(view); } catch {}
    repositionActiveView(); // always reposition before loading
  }

  const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  try {
    await view.webContents.loadURL(normalized);
  } catch (err: unknown) {
    if (getErrorCode(err) !== 'ERR_ABORTED') console.error('[nav:go]', getErrorMessage(err));
  }
});

ipcMain.handle('nav:back', (_, { tabId }: { tabId: string }) => {
  const v = tabViews.get(tabId);
  if (v?.webContents.navigationHistory.canGoBack())
    v.webContents.navigationHistory.goBack();
});

ipcMain.handle('nav:forward', (_, { tabId }: { tabId: string }) => {
  const v = tabViews.get(tabId);
  if (v?.webContents.navigationHistory.canGoForward())
    v.webContents.navigationHistory.goForward();
});

ipcMain.handle('nav:reload', (_, { tabId }: { tabId: string }) =>
  tabViews.get(tabId)?.webContents.reload());

ipcMain.handle('nav:stop', (_, { tabId }: { tabId: string }) =>
  tabViews.get(tabId)?.webContents.stop());

// ─── IPC: Tabs ────────────────────────────────────────────────────────────────

ipcMain.handle('tab:activate', (_, { tabId }: { tabId: string }) => {
  if (!mainWindow) return;
  const prevTabId = activeTabId;
  activeTabId = tabId === 'none' ? null : tabId;

  // Remove ALL child views first
  tabViews.forEach((v) => {
    try { mainWindow!.contentView.removeChildView(v); } catch {}
  });

  if (activeTabId) {
    const view = tabViews.get(activeTabId);
    if (view) {
      try { mainWindow.contentView.addChildView(view); } catch {}
      repositionActiveView();
    }
  }
});

ipcMain.handle('tab:new', (_, { tabId }: { tabId: string }) => {
  createTabView(tabId);
});

ipcMain.handle('tab:close', (_, { tabId }: { tabId: string }) => {
  const view = tabViews.get(tabId);
  if (view && mainWindow) {
    mainWindow.contentView.removeChildView(view);
    view.webContents.close({ waitForBeforeUnload: false });
    tabViews.delete(tabId);
    if (activeTabId === tabId) activeTabId = null;
  }
});

ipcMain.handle('tab:hide', (_, { tabId }: { tabId: string }) => {
  const view = tabViews.get(tabId);
  if (view && mainWindow) {
    try { mainWindow.contentView.removeChildView(view); } catch {}
  }
});

// ─── IPC: Layout sync ────────────────────────────────────────────────────────
// Called whenever the sidebar collapses or expands so the WebContentsView
// reflows to fill the correct region.
let currentSidebarWidth = SIDEBAR_WIDTH;

ipcMain.handle('layout:sidebar-width', (_, { width }: { width: number }) => {
  currentSidebarWidth = width;
  repositionActiveView();
});

function getViewBounds() {
  if (!mainWindow) return null;
  const [w, h] = mainWindow.getContentSize();
  return {
    x: currentSidebarWidth,
    y: currentChromeHeight,
    width:  Math.max(w - currentSidebarWidth, 0),
    height: Math.max(h - currentChromeHeight, 0),
  };
}

let currentChromeHeight = CHROME_HEIGHT;

ipcMain.handle('layout:chrome-height', (_, { height }: { height: number }) => {
  if (height > 0 && height < 300) {
    currentChromeHeight = height;
    repositionActiveView();
  }
});

// ─── IPC: Window controls ─────────────────────────────────────────────────────

ipcMain.handle('win:minimize',   () => mainWindow?.minimize());
ipcMain.handle('win:maximize',   () =>
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('win:close',      () => mainWindow?.close());
ipcMain.handle('win:fullscreen', (_, { on }: { on: boolean }) =>
  mainWindow?.setFullScreen(on));

// ─── IPC: Screenshot — Snipping Tool ─────────────────────────────────────────

/** Helper: get primary display scale factor */
function primaryDisplay() {
  return screen.getPrimaryDisplay();
}

/** Capture full desktop screen */
ipcMain.handle('screenshot:fullscreen', async () => {
  const disp   = primaryDisplay();
  const sf     = disp.scaleFactor;
  const w      = Math.round(disp.size.width  * sf);
  const h      = Math.round(disp.size.height * sf);

  // Hide main window briefly so it doesn't appear in the shot
  mainWindow?.hide();
  await new Promise(r => setTimeout(r, 200));

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: w, height: h },
  });

  mainWindow?.show();
  mainWindow?.focus();

  const src = sources.find(s => s.display_id === String(disp.id)) ?? sources[0];
  if (!src) return { error: 'No screen source' };

  return { success: true, base64: src.thumbnail.toDataURL() };
});

/** Capture active tab's WebContentsView (or full browser window) */
ipcMain.handle('screenshot:window', async (_, { tabId }: { tabId: string }) => {
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
ipcMain.handle('screenshot:region', async () => {
  const disp = primaryDisplay();
  const sf   = disp.scaleFactor;
  const { width: sw, height: sh } = disp.size;

  // 1. Capture the full screen BEFORE showing the overlay (so overlay isn't in shot)
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(sw * sf), height: Math.round(sh * sf) },
  });
  const fullImg = (sources.find(s => s.display_id === String(disp.id)) ?? sources[0])?.thumbnail;
  if (!fullImg) return { error: 'Could not capture screen' };

  return new Promise(resolve => {
    // 2. Open transparent overlay window
    const overlayWin = new BrowserWindow({
      x: disp.bounds.x,
      y: disp.bounds.y,
      width:  disp.bounds.width,
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

    overlayWin.loadFile(
      path.join(ROOT_DIR, 'public/snip-overlay.html')
    );

    // 3. Region selected — crop the pre-captured full image
    const onSelected = (_: Electron.IpcMainEvent, rect: {
      x: number; y: number; width: number; height: number; copyOnly?: boolean;
    }) => {
      cleanup();
      try {
        const cropped = fullImg.crop({
          x:      Math.round(rect.x      * sf),
          y:      Math.round(rect.y      * sf),
          width:  Math.max(1, Math.round(rect.width  * sf)),
          height: Math.max(1, Math.round(rect.height * sf)),
        });
        resolve({ success: true, base64: cropped.toDataURL(), copyOnly: !!rect.copyOnly });
      } catch (e: unknown) {
        resolve({ error: getErrorMessage(e) });
      }
    };

    const onCanceled = () => { cleanup(); resolve({ canceled: true }); };

    const cleanup = () => {
      ipcMain.removeListener('snip:region-selected', onSelected);
      ipcMain.removeListener('snip:canceled',        onCanceled);
      if (!overlayWin.isDestroyed()) overlayWin.close();
    };

    ipcMain.once('snip:region-selected', onSelected);
    ipcMain.once('snip:canceled',        onCanceled);
  });
});

/** Save a base64 PNG to disk via native save dialog */
ipcMain.handle('screenshot:save', async (_, {
  base64, filename,
}: { base64: string; filename: string }) => {
  const picsDir  = app.getPath('pictures');
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title:       'Save Screenshot',
    defaultPath: path.join(picsDir, filename),
    filters: [
      { name: 'PNG Image',  extensions: ['png']  },
      { name: 'JPEG Image', extensions: ['jpg']  },
    ],
  });

  if (canceled || !filePath) return { canceled: true };

  // Strip data-URL header and write raw buffer
  const data = base64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  return { success: true, filePath };
});

/** Copy a base64 image to the system clipboard */
ipcMain.handle('screenshot:copy', async (_, { base64 }: { base64: string }) => {
  const { nativeImage } = await import('electron');
  const img = nativeImage.createFromDataURL(base64);
  clipboard.writeImage(img);
  return { success: true };
});

/** Reveal saved file in Explorer */
ipcMain.handle('screenshot:show-file', (_, { filePath }: { filePath: string }) =>
  shell.showItemInFolder(filePath));

// ─── App lifecycle ────────────────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, corsEnabled: true } }
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace(/^app:\/\/[^/]*\//, '');
    const absolutePath = path.join(ROOT_DIR, 'out', urlPath);
    console.log(`[Protocol] Requested: ${urlPath} -> Resolved: ${absolutePath}`);
    callback({ path: absolutePath });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
