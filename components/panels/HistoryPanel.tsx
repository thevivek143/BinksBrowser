'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import { History, Search, Trash2, Globe } from 'lucide-react';
import styles from './Panel.module.css';

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function HistoryPanel() {
  const { setActivePanel, navigate } = useBrowserStore();
  const { history, clearHistory } = useDataStore();
  const [query, setQuery] = useState('');

  const filtered = history.filter(h =>
    h.title.toLowerCase().includes(query.toLowerCase()) ||
    h.url.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <History size={16} style={{ color: 'var(--brand-secondary)' }} />
          <span className="panel-title">History</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={clearHistory} title="Clear history"><Trash2 size={14} /></button>
          <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search history..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
      </div>
      <div className="panel-body scroll-area">
        <div className={styles.historyGroup}>
          <div className={styles.historyDate}>Today</div>
          {filtered.map(h => (
            <div key={h.id} className={styles.histItem} onClick={() => navigate(h.url)}>
              {h.favicon ? (
                <img src={h.favicon} alt="" width={13} height={13} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              ) : (
                <Globe size={13} style={{ color: 'var(--text-muted)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url.replace(/^https?:\/\//, '').substring(0,30)}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(h.visitedAt)}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No history found</p>
        )}
      </div>
    </div>
  );
}
