'use client';
import { useBrowserStore } from '@/store/browserStore';
import { useSettingsStore, type BooleanSettingKey } from '@/store/settingsStore';
import { Shield, ShieldCheck, Fingerprint, Eye, EyeOff, Lock } from 'lucide-react';
import styles from './Panel.module.css';

const SHIELD_FEATURES: Array<{
  key: BooleanSettingKey;
  label: string;
  desc: string;
  icon: typeof Shield;
}> = [
  { key: 'adBlockEnabled', label: 'Ad Blocker', desc: 'Block intrusive ads and malware', icon: Shield },
  { key: 'trackerBlockEnabled', label: 'Tracker Block', desc: 'Stop cross-site tracking', icon: Eye },
  { key: 'fingerprintProtection', label: 'Fingerprint Shield', desc: 'Mask browser fingerprint', icon: Fingerprint },
  { key: 'httpsOnlyMode', label: 'HTTPS Only', desc: 'Force secure connections', icon: Lock },
  { key: 'doNotTrack', label: 'Do Not Track', desc: 'Send DNT signal to sites', icon: EyeOff },
  { key: 'vaultMode', label: 'Vault Mode', desc: 'Zero-log incognito++', icon: ShieldCheck },
];

export default function PrivacyPanel() {
  const { setActivePanel, privacyScore, blockCount } = useBrowserStore();
  const settings = useSettingsStore();

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: 'var(--color-success)' }} />
          <span className="panel-title">Privacy Shield</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div className="panel-body scroll-area">
        {/* Score */}
        <div className={styles.privacyScore}>
          <div className={styles.scoreNum}>{privacyScore}</div>
          <div className={styles.scoreLbl}>Privacy Score</div>
          <span className="badge badge-success" style={{ marginTop: 6 }}>Excellent</span>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-4" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { num: blockCount.toLocaleString(), lbl: 'Ads Blocked' },
            { num: '23', lbl: 'Trackers' },
            { num: '8ms', lbl: 'Time Saved' },
          ].map(s => (
            <div key={s.lbl} className={styles.statCard} style={{ flex: 1 }}>
              <div className={styles.statCardNum}>{s.num}</div>
              <div className={styles.statCardLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <p className="section-label">Shield Controls</p>
        <div className={styles.toggleList}>
          {SHIELD_FEATURES.map(f => {
            const Icon = f.icon;
            const enabled = settings[f.key];
            return (
              <div key={f.key} className={styles.toggleItem}>
                <Icon size={15} style={{ color: enabled ? 'var(--color-success)' : 'var(--text-muted)', marginRight: 10, flexShrink: 0 }} />
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleName}>{f.label}</div>
                  <div className={styles.toggleDesc}>{f.desc}</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => settings.toggleSetting(f.key)}
                  />
                  <span className="switch-track" />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
