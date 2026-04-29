'use client';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import { Download, CheckCircle, XCircle, Pause, File } from 'lucide-react';
import styles from './Panel.module.css';

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function DownloadsPanel() {
  const { setActivePanel } = useBrowserStore();
  const { downloads } = useDataStore();

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Download size={16} style={{ color: 'var(--color-warning)' }} />
          <span className="panel-title">Downloads</span>
          <span className="badge badge-warning">{downloads.filter(d => d.status === 'downloading').length} active</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div className="panel-body scroll-area">
        {downloads.map(d => (
          <div key={d.id} className={styles.downloadItem}>
            <div className={styles.downloadHeader}>
              <File size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className={styles.downloadName}>{d.filename}</span>
              <span className={styles.downloadSize}>{formatBytes(d.size)}</span>
              {d.status === 'done' && <CheckCircle size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />}
              {d.status === 'error' && <XCircle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
              {d.status === 'downloading' && <Pause size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
            </div>
            {d.status === 'downloading' && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${d.progress}%` }} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{d.status === 'done' ? 'Completed' : d.status === 'downloading' ? `${d.progress}%` : d.status}</span>
              <span>{d.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
            </div>
          </div>
        ))}
        {downloads.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No downloads</p>
        )}
      </div>
    </div>
  );
}
