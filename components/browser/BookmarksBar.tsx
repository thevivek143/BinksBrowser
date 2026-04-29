'use client';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Plus, Globe, ChevronDown } from 'lucide-react';
import styles from './BookmarksBar.module.css';

export default function BookmarksBar() {
  const { navigate } = useBrowserStore();
  const { bookmarks, bookmarkFolders } = useDataStore();
  const { showBookmarksBar } = useSettingsStore();

  if (!showBookmarksBar) return null;

  // Show first 8 bookmarks
  const shown = bookmarks.slice(0, 8);

  return (
    <div className={styles.bar}>
      <div className={styles.items}>
        {bookmarkFolders.slice(0, 2).map(folder => (
          <button key={folder.id} className={styles.folderItem}>
            <span>{folder.icon}</span>
            <span className={styles.label}>{folder.name}</span>
            <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}

        <div className={styles.sep} />

        {shown.map(b => (
          <button
            key={b.id}
            className={styles.item}
            onClick={() => navigate(b.url)}
            title={b.url}
          >
            {b.favicon ? (
              <img src={b.favicon} alt="" width={12} height={12} style={{ borderRadius: 2, flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <Globe size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
            <span className={styles.label}>{b.title}</span>
          </button>
        ))}

        <button className={styles.addBtn} title="Add bookmark">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
