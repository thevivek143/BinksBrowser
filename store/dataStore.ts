import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BookmarkItem {
  id: string; title: string; url: string; favicon: string;
  folderId?: string; createdAt: number; tags: string[];
}
export interface BookmarkFolder { id: string; name: string; icon: string; }
export interface HistoryItem {
  id: string; title: string; url: string; favicon: string;
  visitedAt: number; visitCount: number;
}
export interface DownloadItem {
  id: string; filename: string; url: string; size: number;
  progress: number; status: 'downloading' | 'done' | 'error' | 'paused';
  startedAt: number;
}
export interface Space {
  id: string; name: string; icon: string; color: string; tabIds: string[];
}

interface DataState {
  bookmarks: BookmarkItem[];
  bookmarkFolders: BookmarkFolder[];
  history: HistoryItem[];
  downloads: DownloadItem[];
  spaces: Space[];
  activeSpaceId: string;

  addBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'visitedAt' | 'visitCount'>) => void;
  clearHistory: () => void;
  addDownload: (item: Omit<DownloadItem, 'id' | 'startedAt' | 'progress' | 'status'>) => void;
  updateDownload: (id: string, data: Partial<DownloadItem>) => void;
  addSpace: (name: string, icon: string, color: string) => void;
  setActiveSpace: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      bookmarks: [],
      bookmarkFolders: [
        { id: 'f1', name: 'Development', icon: '💻' },
        { id: 'f2', name: 'Design', icon: '🎨' },
        { id: 'f3', name: 'Reading', icon: '📚' },
      ],
      history: [],
      downloads: [],
      spaces: [
        { id: 's1', name: 'Work',     icon: '💼', color: '#6C63FF', tabIds: [] },
        { id: 's2', name: 'Personal', icon: '🏠', color: '#4ECDC4', tabIds: [] },
      ],
      activeSpaceId: 's1',

      addBookmark: (item) =>
        set(s => ({ bookmarks: [{ ...item, id: uid(), createdAt: Date.now() }, ...s.bookmarks] })),

      removeBookmark: (id) =>
        set(s => ({ bookmarks: s.bookmarks.filter(b => b.id !== id) })),

      addHistoryItem: (item) =>
        set(s => {
          const existing = s.history.find(h => h.url === item.url);
          if (existing) {
            return { history: s.history.map(h => h.url === item.url ? { ...h, visitedAt: Date.now(), visitCount: h.visitCount + 1 } : h) };
          }
          return { history: [{ ...item, id: uid(), visitedAt: Date.now(), visitCount: 1 }, ...s.history.slice(0, 999)] };
        }),

      clearHistory: () => set({ history: [] }),

      addDownload: (item) =>
        set(s => ({ downloads: [{ ...item, id: uid(), startedAt: Date.now(), progress: 0, status: 'downloading' }, ...s.downloads] })),

      updateDownload: (id, data) =>
        set(s => ({ downloads: s.downloads.map(d => d.id === id ? { ...d, ...data } : d) })),

      addSpace: (name, icon, color) =>
        set(s => ({ spaces: [...s.spaces, { id: uid(), name, icon, color, tabIds: [] }] })),

      setActiveSpace: (id) => set({ activeSpaceId: id }),
    }),
    {
      name: 'binks-data',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
