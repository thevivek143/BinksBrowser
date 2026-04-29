'use client';
import { useBrowserStore } from '@/store/browserStore';
import { Puzzle } from 'lucide-react';
import styles from './Panel.module.css';

const EXTENSIONS = [
  { id: 'e1', name: 'uBlock Origin', desc: 'Advanced content blocker', icon: '🛡️', enabled: true, version: '1.55' },
  { id: 'e2', name: 'Dark Reader', desc: 'Dark mode for every website', icon: '🌙', enabled: true, version: '4.9.65' },
  { id: 'e3', name: 'Bitwarden', desc: 'Password manager & secure vault', icon: '🔐', enabled: true, version: '2024.6' },
  { id: 'e4', name: 'Grammarly', desc: 'Writing assistant & grammar check', icon: '📝', enabled: false, version: '14.1' },
  { id: 'e5', name: 'React DevTools', desc: 'Inspect React component trees', icon: '⚛️', enabled: true, version: '5.2' },
  { id: 'e6', name: 'Wappalyzer', desc: 'Identify web technologies', icon: '🔍', enabled: false, version: '6.10' },
];

export default function ExtensionsPanel() {
  const { setActivePanel } = useBrowserStore();

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Puzzle size={16} style={{ color: 'var(--brand-accent)' }} />
          <span className="panel-title">Extensions</span>
          <span className="badge badge-primary">{EXTENSIONS.filter(e => e.enabled).length} active</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div className="panel-body scroll-area">
        <p className="section-label">Installed Extensions</p>
        {EXTENSIONS.map(ext => (
          <div key={ext.id} className={styles.extItem}>
            <div className={styles.extIcon}>{ext.icon}</div>
            <div className={styles.extInfo}>
              <div className={styles.extName}>{ext.name} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>v{ext.version}</span></div>
              <div className={styles.extDesc}>{ext.desc}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked={ext.enabled} />
              <span className="switch-track" />
            </label>
          </div>
        ))}
        <button className="btn btn-surface" style={{ width: '100%', marginTop: 8 }}>
          Browse Extension Store
        </button>
      </div>
    </div>
  );
}
