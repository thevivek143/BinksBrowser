export type ElectronUnsubscribe = () => void;

export interface TabUpdatedPayload {
  tabId: string;
  url?: string;
  title?: string;
  favicon?: string;
  progress?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export interface ScreenshotResponse {
  success?: boolean;
  base64?: string;
  copyOnly?: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: string;
}

export interface ElectronAPI {
  navigate: (tabId: string, url: string) => Promise<unknown>;
  goBack: (tabId: string) => Promise<unknown>;
  goForward: (tabId: string) => Promise<unknown>;
  reload: (tabId: string) => Promise<unknown>;
  stop: (tabId: string) => Promise<unknown>;
  newTab: (tabId: string) => Promise<unknown>;
  activateTab: (tabId: string) => Promise<unknown>;
  closeTab: (tabId: string) => Promise<unknown>;
  hideTab: (tabId: string) => Promise<unknown>;
  minimize: () => Promise<unknown>;
  maximize: () => Promise<unknown>;
  close: () => Promise<unknown>;
  fullscreen: (on: boolean) => Promise<unknown>;
  setSidebarWidth: (width: number) => Promise<unknown>;
  setChromeHeight: (height: number) => Promise<unknown>;
  screenshotFullscreen: () => Promise<ScreenshotResponse>;
  screenshotWindow: (tabId: string) => Promise<ScreenshotResponse>;
  screenshotRegion: () => Promise<ScreenshotResponse>;
  screenshotSave: (base64: string, filename: string) => Promise<ScreenshotResponse>;
  screenshotCopy: (base64: string) => Promise<ScreenshotResponse>;
  screenshotShowFile: (filePath: string) => Promise<unknown>;
  onTabUpdated: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabLoading: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabNavigate: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabError: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabTitle: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabFavicon: (cb: (data: TabUpdatedPayload) => void) => ElectronUnsubscribe;
  onTabOpenNew: (cb: (data: { url: string }) => void) => ElectronUnsubscribe;
  isElectron: true;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const electronAPI = typeof window !== 'undefined'
  ? window.electronAPI
  : undefined;

export const isElectron = Boolean(electronAPI);

export type Platform = 'win32' | 'darwin' | 'linux' | 'web';

const electronPlatform = electronAPI?.platform;

export const platform: Platform = isElectron
  ? electronPlatform === 'win32' || electronPlatform === 'darwin' || electronPlatform === 'linux'
    ? electronPlatform
    : 'web'
  : 'web';
