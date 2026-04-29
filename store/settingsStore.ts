import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'ecosia';

const SEARCH_URLS: Record<SearchEngine, string> = {
  google:     'https://www.google.com/search?q=',
  bing:       'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave:      'https://search.brave.com/search?q=',
  ecosia:     'https://www.ecosia.org/search?q=',
};

export function getSearchUrl(engine: SearchEngine, query: string): string {
  return SEARCH_URLS[engine] + encodeURIComponent(query);
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface SettingsState {
  searchEngine: SearchEngine;
  adBlockEnabled: boolean;
  trackerBlockEnabled: boolean;
  httpsOnlyMode: boolean;
  doNotTrack: boolean;
  fingerprintProtection: boolean;
  vaultMode: boolean;
  turboMode: boolean;
  gamingMode: boolean;
  showBookmarksBar: boolean;
  autoDarkTheme: boolean;
  perSiteThemes: boolean;
  sidebarPosition: 'left' | 'right';
  fontSize: number;
  zoomLevel: number;
  language: string;
  notifications: boolean;
  hardwareAcceleration: boolean;
  activeProfile: string;
  profiles: Profile[];
  geminiApiKey: string;

  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  toggleSetting: (key: BooleanSettingKey) => void;
}

export type BooleanSettingKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      searchEngine: 'google',
      adBlockEnabled: true,
      trackerBlockEnabled: true,
      httpsOnlyMode: true,
      doNotTrack: true,
      fingerprintProtection: true,
      vaultMode: false,
      turboMode: true,
      gamingMode: false,
      showBookmarksBar: true,
      autoDarkTheme: false,
      perSiteThemes: true,
      sidebarPosition: 'left',
      fontSize: 16,
      zoomLevel: 100,
      language: 'en-US',
      notifications: true,
      hardwareAcceleration: true,
      activeProfile: 'p1',
      profiles: [
        { id: 'p1', name: 'Work',     avatar: '👨‍💻', color: '#6C63FF' },
        { id: 'p2', name: 'Personal', avatar: '🏠',  color: '#4ECDC4' },
        { id: 'p3', name: 'Gaming',   avatar: '🎮',  color: '#FF6B9D' },
      ],
      geminiApiKey: '',

      setSetting:    (key, value) => set({ [key]: value } as Pick<SettingsState, typeof key>),
      toggleSetting: (key)        => set(s => ({ [key]: !s[key] } as Pick<SettingsState, typeof key>)),
    }),
    {
      name: 'binks-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
