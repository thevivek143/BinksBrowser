'use client';
import { useBrowserStore } from '@/store/browserStore';
import { useSettingsStore, type BooleanSettingKey, type SearchEngine } from '@/store/settingsStore';
import { Settings } from 'lucide-react';
import styles from './Panel.module.css';

const SETTINGS_SECTIONS: Array<{
  title: string;
  items: Array<{ key: BooleanSettingKey; label: string; desc: string }>;
}> = [
  {
    title: 'Appearance & Theme Engine',
    items: [
      { key: 'showBookmarksBar', label: 'Show Bookmarks Bar', desc: 'Display bookmarks below address bar' },
      { key: 'autoDarkTheme', label: 'Auto Dark Theme', desc: 'Force dark mode on all websites' },
      { key: 'perSiteThemes', label: 'Per-Site Themes', desc: 'Extract and apply brand colors per domain' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { key: 'turboMode', label: 'Turbo Mode', desc: 'Aggressive preloading & compression' },
      { key: 'hardwareAcceleration', label: 'Hardware Acceleration', desc: 'Use GPU for rendering' },
      { key: 'gamingMode', label: 'Gaming Mode', desc: 'Disable throttling, prioritize performance' },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      { key: 'adBlockEnabled', label: 'Ad Blocker', desc: 'Block ads across all sites' },
      { key: 'trackerBlockEnabled', label: 'Tracker Blocking', desc: 'Stop cross-site tracking' },
      { key: 'fingerprintProtection', label: 'Fingerprint Protection', desc: 'Mask browser identity' },
      { key: 'httpsOnlyMode', label: 'HTTPS Only', desc: 'Block insecure connections' },
      { key: 'vaultMode', label: 'Vault Mode', desc: 'Enhanced private browsing' },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { key: 'notifications', label: 'Browser Notifications', desc: 'Allow website notifications' },
    ],
  },
];

const SEARCH_ENGINES: Array<{ id: SearchEngine; label: string; icon: string }> = [
  { id: 'google', label: 'Google', icon: '🔍' },
  { id: 'bing', label: 'Bing', icon: '🔵' },
  { id: 'duckduckgo', label: 'DuckDuckGo', icon: '🦆' },
  { id: 'brave', label: 'Brave Search', icon: '🦁' },
  { id: 'ecosia', label: 'Ecosia', icon: '🌱' },
];

export default function SettingsPanel() {
  const { setActivePanel } = useBrowserStore();
  const settings = useSettingsStore();

  return (
    <div className="panel" style={{ width: 380 }}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Settings size={16} style={{ color: 'var(--text-secondary)' }} />
          <span className="panel-title">Settings</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div className="panel-body scroll-area">
        {/* Search Engine */}
        <div className={styles.settingSection}>
          <p className="section-label" style={{ marginBottom: 10 }}>Default Search Engine</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SEARCH_ENGINES.map(e => (
              <button
                key={e.id}
                className={`btn ${settings.searchEngine === e.id ? 'btn-primary' : 'btn-surface'}`}
                style={{ fontSize: 12, padding: '5px 10px', gap: 5 }}
                onClick={() => settings.setSetting('searchEngine', e.id)}
              >
                <span>{e.icon}</span> {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Profiles */}
        <div className={styles.settingSection}>
          <p className="section-label" style={{ marginBottom: 10 }}>Profiles</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {settings.profiles.map(p => (
              <button
                key={p.id}
                onClick={() => settings.setSetting('activeProfile', p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 14px', borderRadius: 'var(--radius-lg)', border: '2px solid',
                  borderColor: settings.activeProfile === p.id ? p.color : 'var(--glass-border)',
                  background: settings.activeProfile === p.id ? p.color + '14' : 'transparent',
                  cursor: 'pointer', fontSize: 20,
                }}
              >
                <span>{p.avatar}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Toggle settings */}
        {SETTINGS_SECTIONS.map(section => (
          <div key={section.title} className={styles.settingSection}>
            <p className="section-label">{section.title}</p>
            {section.items.map(item => {
              const enabled = settings[item.key];
              return (
                <div key={item.key} className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>{item.label}</div>
                    <div className={styles.settingDesc}>{item.desc}</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={enabled} onChange={() => settings.toggleSetting(item.key)} />
                    <span className="switch-track" />
                  </label>
                </div>
              );
            })}
          </div>
        ))}

        {/* Zoom */}
        <div className={styles.settingSection}>
          <p className="section-label">Page Zoom</p>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Zoom Level</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-surface" style={{ padding: '4px 10px', fontSize: 16 }}
                onClick={() => settings.setSetting('zoomLevel', Math.max(50, settings.zoomLevel - 10))}>−</button>
              <span style={{ fontSize: 13, width: 40, textAlign: 'center' }}>{settings.zoomLevel}%</span>
              <button className="btn btn-surface" style={{ padding: '4px 10px', fontSize: 16 }}
                onClick={() => settings.setSetting('zoomLevel', Math.min(200, settings.zoomLevel + 10))}>+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
