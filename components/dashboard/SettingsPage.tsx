'use client';
import { useState } from 'react';
import { useSettingsStore, SearchEngine } from '@/store/settingsStore';
import { Shield, Palette, Key, Monitor, Bot, Settings as SettingsIcon } from 'lucide-react';
import styles from './SettingsPage.module.css';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'ai', label: 'AI Configuration', icon: Bot },
];

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className={styles.settingsPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Settings</h1>
        </div>
        
        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className={styles.content}>
            
            {activeTab === 'general' && (
              <div className={styles.section}>
                <h2>General</h2>
                
                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Default Search Engine</h3>
                      <p>Used in the address bar and new tab page.</p>
                    </div>
                    <select 
                      className={styles.select}
                      value={settings.searchEngine}
                      onChange={e => settings.setSetting('searchEngine', e.target.value as SearchEngine)}
                    >
                      <option value="google">Google</option>
                      <option value="duckduckgo">DuckDuckGo</option>
                      <option value="bing">Bing</option>
                      <option value="brave">Brave</option>
                      <option value="ecosia">Ecosia</option>
                    </select>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Hardware Acceleration</h3>
                      <p>Use graphics hardware to improve performance.</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={settings.hardwareAcceleration}
                        onChange={() => settings.toggleSetting('hardwareAcceleration')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className={styles.section}>
                <h2>Appearance</h2>
                
                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Show Bookmarks Bar</h3>
                      <p>Display bookmarks below the address bar.</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={settings.showBookmarksBar}
                        onChange={() => settings.toggleSetting('showBookmarksBar')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Auto Dark Theme</h3>
                      <p>Automatically match your system theme.</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={settings.autoDarkTheme}
                        onChange={() => settings.toggleSetting('autoDarkTheme')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className={styles.section}>
                <h2>Privacy & Security</h2>
                
                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Ad Blocker</h3>
                      <p>Block intrusive ads and speed up page loading.</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={settings.adBlockEnabled}
                        onChange={() => settings.toggleSetting('adBlockEnabled')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.row}>
                    <div>
                      <h3>Block Trackers</h3>
                      <p>Prevent cross-site tracking across websites.</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={settings.trackerBlockEnabled}
                        onChange={() => settings.toggleSetting('trackerBlockEnabled')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className={styles.section}>
                <h2>AI Configuration</h2>
                
                <div className={styles.card}>
                  <div className={styles.rowVertical}>
                    <h3>Gemini API Key</h3>
                    <p>Enter your Google Gemini API key to enable real-time AI capabilities in the browser's side panel.</p>
                    <input 
                      type="password"
                      className={styles.input}
                      placeholder="AIzaSy..."
                      value={settings.geminiApiKey}
                      onChange={e => settings.setSetting('geminiApiKey', e.target.value)}
                    />
                    <small className={styles.helpText}>Your key is stored locally and never sent anywhere except directly to Google API.</small>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
