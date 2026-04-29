'use client';
import { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import {
  Layers, Bookmark, History, Download, Puzzle,
  LayoutGrid, ChevronLeft, ChevronRight,
  Plus, Settings, Globe, X, ExternalLink
} from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { electronAPI, isElectron } from '@/lib/electron';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'tabs',       icon: Layers,     label: 'Tabs',       tooltip: 'Tab Manager' },
  { id: 'bookmarks',  icon: Bookmark,   label: 'Bookmarks',  tooltip: 'Bookmarks' },
  { id: 'history',    icon: History,    label: 'History',    tooltip: 'History' },
  { id: 'downloads',  icon: Download,   label: 'Downloads',  tooltip: 'Downloads' },
  { id: 'extensions', icon: Puzzle,     label: 'Extensions', tooltip: 'Extensions' },
  { id: 'spaces',     icon: LayoutGrid, label: 'Spaces',     tooltip: 'Spaces & Workspaces' },
] as const;

export default function Sidebar() {
  const {
    sidebarOpen, sidebarCollapsed,
    setSidebarCollapsed,
    activeSidebarItem, setActiveSidebarItem,
    tabs, activeTabId, setActiveTab, addTab, closeTab,
    setActivePanel, activePanel,
  } = useBrowserStore();
  const { spaces, activeSpaceId, setActiveSpace, addSpace, bookmarks, history } = useDataStore();
  const { profiles, activeProfile, setSetting } = useSettingsStore();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const activeProfileData = profiles.find(p => p.id === activeProfile);

  const collapsed = !sidebarOpen || sidebarCollapsed;

  // Single source of truth — no hover dual-state
  // Sync initial sidebar width to Electron on mount
  useEffect(() => {
    if (isElectron && electronAPI) {
      electronAPI.setSidebarWidth(collapsed ? 0 : 240);
    }
  }, [collapsed]);

  if (!sidebarOpen) return null;

  function toggle() {
    const next = !collapsed;
    setSidebarCollapsed(next);
    setProfileMenuOpen(false);
    if (isElectron && electronAPI) {
      // 0 = --sidebar-collapsed, 240 = --sidebar-width
      electronAPI.setSidebarWidth(next ? 0 : 240);
    }
  }

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      {/* ── Profile header ──────────────────────────────── */}
      <div className={styles.profileHeader}>
        {!collapsed && (
          <div
            className={styles.profileInner}
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className={styles.profileAvatar}
              style={{ background: `linear-gradient(135deg, ${activeProfileData?.color || '#6C63FF'}, ${activeProfileData?.color || '#6C63FF'}88)` }}
            >
              {activeProfileData?.avatar || '👤'}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{activeProfileData?.name || 'Profile'} ▾</span>
              <span className={styles.profileRole}>Synced</span>
            </div>
          </div>
        )}

        {/* Always-visible toggle button */}
        <button
          className={`btn-icon ${styles.collapseBtn} ${collapsed ? styles.collapseBtnCentered : ''}`}
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* ── Profile switcher dropdown ────────────────────── */}
      {profileMenuOpen && !collapsed && (
        <div className={styles.profileMenu}>
          {profiles.map(p => (
            <button
              key={p.id}
              className={`${styles.profileMenuItem} ${p.id === activeProfile ? styles.profileMenuActive : ''}`}
              onClick={() => { setSetting('activeProfile', p.id); setProfileMenuOpen(false); }}
            >
              <div className={styles.profileAvatar} style={{ width: 22, height: 22, fontSize: 12, background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }}>
                {p.avatar}
              </div>
              <span>{p.name}</span>
            </button>
          ))}
          <div className={styles.divider} style={{ margin: '4px 0' }} />
          <button
            className={styles.profileMenuItem}
            onClick={() => { alert('Add New Profile'); setProfileMenuOpen(false); }}
          >
            <Plus size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Add Profile</span>
          </button>
        </div>
      )}

      {/* ── Nav icons ────────────────────────────────────── */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeSidebarItem === item.id ? styles.navActive : ''}`}
              onClick={() => setActiveSidebarItem(item.id)}
              title={item.tooltip}
              data-tooltip={collapsed ? item.tooltip : undefined}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {item.id === 'downloads' && !collapsed && (
                <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: 10 }}>2</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.divider} />

      {/* ── Content area ─────────────────────────────────── */}
      {!collapsed && (
        <div className={styles.sidebarContent}>

          {activeSidebarItem === 'tabs' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className="section-label">Open Tabs</span>
                <button className="btn-icon" onClick={() => addTab()} title="New tab"><Plus size={14} /></button>
              </div>
              <div className={styles.tabList}>
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    className={`${styles.sidebarTab} ${tab.id === activeTabId ? styles.sidebarTabActive : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.favicon
                      ? <img src={tab.favicon} alt="" width={13} height={13} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <Globe size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    }
                    <span className={styles.sidebarTabTitle}>{tab.title || 'New Tab'}</span>
                    {tab.isSleeping && <span className={styles.sleepBadge}>💤</span>}
                    {tabs.length > 1 && (
                      <button
                        className={styles.sidebarTabClose}
                        onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                        title="Close Tab"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'spaces' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className="section-label">Spaces</span>
                <button className="btn-icon" onClick={() => addSpace('New Space', '⭐', '#6C63FF')} title="Add space"><Plus size={14} /></button>
              </div>
              <div className={styles.spacesList}>
                {spaces.map(space => (
                  <div
                    key={space.id}
                    className={`${styles.spaceItem} ${space.id === activeSpaceId ? styles.spaceActive : ''}`}
                    onClick={() => setActiveSpace(space.id)}
                    style={space.id === activeSpaceId ? { borderColor: space.color + '44' } : {}}
                  >
                    <div className={styles.spaceIcon} style={{ background: space.color + '22', color: space.color }}>{space.icon}</div>
                    <div className={styles.spaceInfo}>
                      <span className={styles.spaceName}>{space.name}</span>
                      <span className={styles.spaceCount}>{space.tabIds.length} tabs</span>
                    </div>
                    {space.id === activeSpaceId && <div className={styles.spaceActiveBar} style={{ background: space.color }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarItem === 'bookmarks' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className="section-label">Bookmarks</span>
                <button className="btn-icon" onClick={() => setActivePanel('bookmarks')} title="Open Panel"><ExternalLink size={14} /></button>
              </div>
              <div className={styles.tabList}>
                {bookmarks.slice(0, 8).map(b => (
                  <div key={b.id} className={styles.sidebarTab} onClick={() => useBrowserStore.getState().navigate(b.url)}>
                    {b.favicon ? <img src={b.favicon} width={13} height={13} alt="" style={{ borderRadius: 2 }} /> : <Bookmark size={13} />}
                    <span className={styles.sidebarTabTitle}>{b.title}</span>
                  </div>
                ))}
                {bookmarks.length === 0 && <p className={styles.hint}>No bookmarks yet.</p>}
              </div>
              <button className="btn btn-surface" style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                onClick={() => setActivePanel(activePanel === 'bookmarks' ? null : 'bookmarks')}>
                Manage Bookmarks
              </button>
            </div>
          )}

          {activeSidebarItem === 'history' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className="section-label">Recent History</span>
                <button className="btn-icon" onClick={() => setActivePanel('history')} title="Open Panel"><ExternalLink size={14} /></button>
              </div>
              <div className={styles.tabList}>
                {history.slice(0, 8).map(h => (
                  <div key={h.id} className={styles.sidebarTab} onClick={() => useBrowserStore.getState().navigate(h.url)}>
                    {h.favicon ? <img src={h.favicon} width={13} height={13} alt="" style={{ borderRadius: 2 }} /> : <History size={13} />}
                    <span className={styles.sidebarTabTitle}>{h.title || h.url}</span>
                  </div>
                ))}
                {history.length === 0 && <p className={styles.hint}>No history yet.</p>}
              </div>
              <button className="btn btn-surface" style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')}>
                View Full History
              </button>
            </div>
          )}

          {activeSidebarItem === 'downloads' && (
            <div className={styles.section}>
              <span className="section-label">Downloads</span>
              <button className="btn btn-surface" style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                onClick={() => setActivePanel(activePanel === 'downloads' ? null : 'downloads')}>
                Open Downloads Panel
              </button>
            </div>
          )}

          {activeSidebarItem === 'extensions' && (
            <div className={styles.section}>
              <span className="section-label">Extensions</span>
              <button className="btn btn-surface" style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                onClick={() => setActivePanel(activePanel === 'extensions' ? null : 'extensions')}>
                Manage Extensions
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Settings ─────────────────────────────── */}
      <div className={styles.sidebarBottom}>
        <button
          className={`${styles.navItem} ${activePanel === 'settings' ? styles.navActive : ''}`}
          onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          title="Settings"
          data-tooltip={collapsed ? 'Settings' : undefined}
        >
          <Settings size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span className={styles.navLabel}>Settings</span>}
        </button>
      </div>
    </div>
  );
}
