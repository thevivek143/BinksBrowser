import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { electronAPI, isElectron, type TabUpdatedPayload } from '@/lib/electron';

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon: string;
  isLoading: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isActive: boolean;
  groupId?: string;
  groupColor?: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loadProgress: number;
  isSleeping: boolean;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

export type PanelType =
  | 'ai' | 'privacy' | 'bookmarks' | 'history'
  | 'extensions' | 'downloads' | 'settings' | 'session'
  | null;

export type SidebarItem =
  | 'tabs' | 'bookmarks' | 'history' | 'downloads'
  | 'extensions' | 'spaces';

export interface SpeedDialSite {
  title: string;
  url: string;
  icon: string;
  color: string;
}

export interface TimeStat {
  site: string;
  minutes: number;
  color: string;
}

interface BrowserState {
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeSidebarItem: SidebarItem;
  activePanel: PanelType;
  commandPaletteOpen: boolean;
  splitViewOpen: boolean;
  splitTabId: string | null;
  readingMode: boolean;
  focusMode: boolean;
  tabCanvasOpen: boolean;
  isFullscreen: boolean;
  privacyScore: number;
  blockCount: number;

  speedDial: SpeedDialSite[];
  timeStats: TimeStat[];

  addSpeedDial: (site: SpeedDialSite) => void;
  removeSpeedDial: (url: string) => void;
  incrementTimeStat: (site: string, minutes: number) => void;
  incrementBlockCount: (amount: number) => void;
  updateActiveTime: () => void;

  addTab: (url?: string, title?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<Tab>) => void;
  pinTab: (id: string) => void;
  muteTab: (id: string) => void;
  sleepTab: (id: string) => void;
  duplicateTab: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveSidebarItem: (item: SidebarItem) => void;
  setActivePanel: (panel: PanelType) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSplitView: (open: boolean, tabId?: string) => void;
  setReadingMode: (on: boolean) => void;
  setFocusMode: (on: boolean) => void;
  setTabCanvas: (open: boolean) => void;
  setFullscreen: (on: boolean) => void;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function makeTab(url = 'binks://newtab', title = 'New Tab', id?: string): Tab {
  return {
    id: id ?? uid(), title, url,
    favicon: url.startsWith('http') ? `https://www.google.com/s2/favicons?sz=32&domain=${url}` : '',
    isLoading: false, isPinned: false, isMuted: false, isActive: true,
    canGoBack: false, canGoForward: false, loadProgress: 0, isSleeping: false,
  };
}

const INITIAL_TAB = makeTab('binks://newtab', 'New Tab', 'tab-home');

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [{ ...INITIAL_TAB, isActive: true }],
      tabGroups: [],
      activeTabId: INITIAL_TAB.id,
      sidebarOpen: true,
      sidebarCollapsed: true,
      activeSidebarItem: 'tabs',
      activePanel: null,
      commandPaletteOpen: false,
      splitViewOpen: false,
      splitTabId: null,
      readingMode: false,
      focusMode: false,
      tabCanvasOpen: false,
      isFullscreen: false,
      privacyScore: 94,
      blockCount: 0,

      speedDial: [
        { title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#333' },
        { title: 'YouTube', url: 'https://youtube.com', icon: '▶️', color: '#FF0000' },
        { title: 'Gmail', url: 'https://mail.google.com', icon: '📧', color: '#EA4335' },
        { title: 'Twitter/X', url: 'https://twitter.com', icon: '𝕏', color: '#000' },
        { title: 'Figma', url: 'https://figma.com', icon: '🎨', color: '#F24E1E' },
        { title: 'Notion', url: 'https://notion.so', icon: '📝', color: '#fff' },
        { title: 'Vercel', url: 'https://vercel.com', icon: '▲', color: '#000' },
        { title: 'Reddit', url: 'https://reddit.com', icon: '🤖', color: '#FF4500' },
      ],
      timeStats: [],

      addSpeedDial: (site) => set(s => ({ speedDial: [...s.speedDial, site] })),
      removeSpeedDial: (url) => set(s => ({ speedDial: s.speedDial.filter(d => d.url !== url) })),
      incrementTimeStat: (site, mins) => set(s => {
        const exists = s.timeStats.find(t => t.site === site);
        if (exists) return { timeStats: s.timeStats.map(t => t.site === site ? { ...t, minutes: t.minutes + mins } : t).sort((a,b) => b.minutes - a.minutes) };
        return { timeStats: [...s.timeStats, { site, minutes: mins, color: `hsl(${Math.random() * 360}, 70%, 60%)` }].sort((a,b) => b.minutes - a.minutes) };
      }),
      incrementBlockCount: (amount) => set(s => ({ blockCount: s.blockCount + amount })),
      updateActiveTime: () => {
        const { tabs, activeTabId, incrementTimeStat } = get();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.url && activeTab.url !== 'binks://newtab') {
          try {
            let domain = new URL(activeTab.url).hostname.replace(/^www\./, '');
            // Capitalize first letter for display
            domain = domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
            incrementTimeStat(domain, 1);
          } catch {}
        }
      },

      addTab: (url = 'binks://newtab', title = 'New Tab') => {
        const tab = makeTab(url, title);
        set(s => ({
          tabs: [...s.tabs.map(t => ({ ...t, isActive: false })), tab],
          activeTabId: tab.id,
        }));
        if (isElectron && electronAPI) {
          electronAPI.newTab(tab.id);
          if (url !== 'binks://newtab') get().navigate(url);
          else electronAPI.activateTab('none');
        }
      },

      closeTab: (id) => {
        if (isElectron && electronAPI) electronAPI.closeTab(id);
        const { tabs, activeTabId } = get();
        const remaining = tabs.filter(t => t.id !== id);
        if (remaining.length === 0) {
          const fresh = makeTab();
          set({ tabs: [fresh], activeTabId: fresh.id });
          if (isElectron && electronAPI) electronAPI.newTab(fresh.id);
          return;
        }
        const nextId = activeTabId === id
          ? remaining[Math.max(0, tabs.findIndex(t => t.id === id) - 1)].id
          : activeTabId;
        set({ tabs: remaining.map(t => ({ ...t, isActive: t.id === nextId })), activeTabId: nextId });
      },

      setActiveTab: (id) => {
        if (isElectron && electronAPI) {
          const { tabs } = get();
          const tab = tabs.find(t => t.id === id);
          if (!tab || tab.url === 'binks://newtab') {
            electronAPI.activateTab('none');
          } else {
            electronAPI.activateTab(id);
            // Re-navigate in case the view was blanked by a home button press
            electronAPI.navigate(id, tab.url);
          }
        }
        set(s => ({
          tabs: s.tabs.map(t => ({ ...t, isActive: t.id === id })),
          activeTabId: id,
        }));
      },

      updateTab: (id, data) =>
        set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, ...data } : t) })),

      pinTab: (id) =>
        set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t) })),

      muteTab: (id) =>
        set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, isMuted: !t.isMuted } : t) })),

      sleepTab: (id) => {
        if (isElectron && electronAPI) electronAPI.hideTab(id);
        set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, isSleeping: !t.isSleeping } : t) }));
      },

      duplicateTab: (id) => {
        const tab = get().tabs.find(t => t.id === id);
        if (!tab) return;
        get().addTab(tab.url, tab.title);
      },

      setSidebarOpen:       (open)      => set({ sidebarOpen: open }),
      setSidebarCollapsed:  (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveSidebarItem: (item)      => set({ activeSidebarItem: item }),
      setActivePanel:       (panel)     => set(s => ({ activePanel: s.activePanel === panel ? null : panel })),
      setCommandPaletteOpen:(open)      => set({ commandPaletteOpen: open }),
      setSplitView:         (open, id)  => set({ splitViewOpen: open, splitTabId: id ?? null }),
      setReadingMode:       (on)        => set({ readingMode: on }),
      setFocusMode:         (on)        => set({ focusMode: on }),
      setTabCanvas:         (open)      => set({ tabCanvasOpen: open }),
      setFullscreen:        (on)        => { set({ isFullscreen: on }); if (isElectron && electronAPI) electronAPI.fullscreen(on); },

      navigate: (url) => {
        const { activeTabId } = get();
        if (!url?.trim()) return;
        const isNewTab = url === 'binks://newtab';
        const processed = isNewTab ? url : /^https?:\/\//i.test(url) ? url : `https://${url}`;

        if (isElectron && electronAPI) {
          if (isNewTab) {
            // Hide the native view — show the React NewTabPage instead
            electronAPI.activateTab('none');
            set(s => ({
              tabs: s.tabs.map(t => t.id === activeTabId ? {
                ...t, url: 'binks://newtab',
                title: 'New Tab', isLoading: false, loadProgress: 0,
                favicon: '', // Preserve canGoBack/canGoForward so user can return to previous site
              } : t),
            }));
          } else {
            electronAPI.activateTab(activeTabId);
            electronAPI.navigate(activeTabId, processed);
            set(s => ({
              tabs: s.tabs.map(t => t.id === activeTabId ? {
                ...t, url: processed, isLoading: true, loadProgress: 10,
                title: new URL(processed).hostname,
                favicon: `https://www.google.com/s2/favicons?sz=32&domain=${processed}`,
                canGoBack: t.url !== 'binks://newtab',
              } : t),
            }));
          }
          return;
        }

        // Web fallback (no Electron)
        set(s => ({
          tabs: s.tabs.map(t => t.id === activeTabId ? {
            ...t, url: processed,
            title: isNewTab ? 'New Tab' : processed.replace(/^https?:\/\//, '').split('/')[0],
            isLoading: !isNewTab, loadProgress: isNewTab ? 0 : 15,
            favicon: isNewTab ? '' : `https://www.google.com/s2/favicons?sz=32&domain=${processed}`,
            canGoBack: !isNewTab,
          } : t),
        }));

        if (!isNewTab) {
          setTimeout(() => {
            set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, loadProgress: 70 } : t) }));
            setTimeout(() => {
              set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, isLoading: false, loadProgress: 100 } : t) }));
            }, 500);
          }, 300);
        }
      },

      goBack: () => {
        const { activeTabId } = get();
        if (isElectron && electronAPI) {
          electronAPI.activateTab(activeTabId);
          electronAPI.goBack(activeTabId);
        }
        else set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, canGoForward: true } : t) }));
      },

      goForward: () => {
        const { activeTabId } = get();
        if (isElectron && electronAPI) {
          electronAPI.activateTab(activeTabId);
          electronAPI.goForward(activeTabId);
        }
        else set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, canGoForward: false } : t) }));
      },

      reload: () => {
        const { activeTabId } = get();
        if (isElectron && electronAPI) {
          electronAPI.activateTab(activeTabId);
          electronAPI.reload(activeTabId);
        }
        else {
          set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, isLoading: true, loadProgress: 20 } : t) }));
          setTimeout(() => set(s => ({ tabs: s.tabs.map(t => t.id === activeTabId ? { ...t, isLoading: false, loadProgress: 100 } : t) })), 800);
        }
      },
    }),
    {
      name: 'binks-browser',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences and custom stats
      partialize: (s) => ({
        sidebarOpen: s.sidebarOpen,
        sidebarCollapsed: s.sidebarCollapsed,
        focusMode: s.focusMode,
        tabGroups: s.tabGroups,
        blockCount: s.blockCount,
        speedDial: s.speedDial,
        timeStats: s.timeStats,
      }),
    }
  )
);

// ─── Electron event bridge (called once on app mount) ─────────────

export function initElectronBridge() {
  if (!isElectron || !electronAPI) return undefined;
  const store = useBrowserStore.getState();

  const cleanups = [
    electronAPI.onTabUpdated((d: TabUpdatedPayload) => {
      store.updateTab(d.tabId, {
        url: d.url ?? '',
        title: d.title ?? '',
        favicon: d.favicon ?? '',
        isLoading: false,
        loadProgress: 100,
        canGoBack: Boolean(d.canGoBack),
        canGoForward: Boolean(d.canGoForward),
      });
      useBrowserStore.setState(s => ({ blockCount: s.blockCount + 1 }));
    }),

    electronAPI.onTabLoading((d: TabUpdatedPayload) =>
      store.updateTab(d.tabId, { isLoading: true, loadProgress: d.progress ?? 15 })),

    electronAPI.onTabNavigate((d: TabUpdatedPayload) =>
      store.updateTab(d.tabId, {
        url: d.url ?? '',
        canGoBack: Boolean(d.canGoBack),
        canGoForward: Boolean(d.canGoForward),
      })),

    electronAPI.onTabTitle((d: TabUpdatedPayload) =>
      store.updateTab(d.tabId, { title: d.title ?? '' })),

    electronAPI.onTabFavicon((d: TabUpdatedPayload) =>
      store.updateTab(d.tabId, { favicon: d.favicon ?? '' })),

    electronAPI.onTabError((d: TabUpdatedPayload) =>
      store.updateTab(d.tabId, { isLoading: false, loadProgress: 0 })),
  ];

  return () => cleanups.forEach(cleanup => cleanup());
}
