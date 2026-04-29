'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import { Bookmark, Search, Trash2, ExternalLink, Globe } from 'lucide-react';
import styles from './Panel.module.css';

export default function BookmarksPanel() {
  const { setActivePanel, navigate } = useBrowserStore();
  const { bookmarks, removeBookmark } = useDataStore();
  const [query, setQuery] = useState('');

  const filtered = bookmarks.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.url.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Bookmark size={16} style={{ color: 'var(--brand-primary)' }} />
          <span className="panel-title">Bookmarks</span>
          <span className="badge badge-primary">{bookmarks.length}</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search bookmarks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>
      <div className="panel-body scroll-area">
        <p className="section-label">All Bookmarks</p>
        {filtered.map(b => (
          <div key={b.id} className={styles.bookmarkItem}>
            {b.favicon ? (
              <img src={b.favicon} alt="" width={14} height={14} style={{ borderRadius: 3 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            ) : (
              <Globe size={14} style={{ color: 'var(--text-muted)' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.bookmarkTitle}>{b.title}</div>
              <div className={styles.bookmarkUrl}>{b.url.replace(/^https?:\/\//, '').substring(0, 30)}</div>
            </div>
            <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => navigate(b.url)} title="Open">
              <ExternalLink size={12} />
            </button>
            <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => removeBookmark(b.id)} title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No bookmarks found
          </p>
        )}
      </div>
    </div>
  );
}
