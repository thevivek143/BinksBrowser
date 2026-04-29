'use client';
import { useState } from 'react';
import { useBrowserStore, Tab } from '@/store/browserStore';
import { X, Plus, Volume2, VolumeX, Pin, Moon, Globe, Minus, Square } from 'lucide-react';
import { electronAPI, isElectron } from '@/lib/electron';
import styles from './TabBar.module.css';

function FaviconOrGlobe({ tab }: { tab: Tab }) {
  const [error, setError] = useState(false);
  if (!tab.favicon || error || tab.url === 'binks://newtab') {
    return <Globe size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />;
  }
  return (
    <img
      src={tab.favicon}
      alt=""
      width={14}
      height={14}
      style={{ borderRadius: 3, flexShrink: 0 }}
      onError={() => setError(true)}
    />
  );
}

function TabItem({ tab, onClose, onActivate }: {
  tab: Tab;
  onClose: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const { pinTab, muteTab, sleepTab, duplicateTab } = useBrowserStore();
  const [showCtx, setShowCtx] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setShowCtx(true);
  };

  return (
    <>
      <div
        className={`${styles.tab} ${tab.isActive ? styles.active : ''} ${tab.isPinned ? styles.pinned : ''} ${tab.isSleeping ? styles.sleeping : ''}`}
        onClick={() => onActivate(tab.id)}
        onContextMenu={handleContextMenu}
        title={tab.title}
      >
        {tab.groupColor && (
          <div className={styles.groupDot} style={{ background: tab.groupColor }} />
        )}
        <div className={styles.favicon}>
          {tab.isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <FaviconOrGlobe tab={tab} />
          )}
        </div>
        {!tab.isPinned && (
          <>
            <span className={styles.tabTitle}>{tab.title || 'New Tab'}</span>
            {tab.isMuted && <VolumeX size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            {tab.isSleeping && <Moon size={11} style={{ color: 'var(--brand-secondary)', flexShrink: 0 }} />}
            <button
              className={styles.closeBtn}
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              aria-label="Close tab"
            >
              <X size={12} />
            </button>
          </>
        )}
        {tab.isLoading && !tab.isPinned && (
          <div className={styles.loadBar} style={{ width: `${tab.loadProgress}%` }} />
        )}
      </div>

      {showCtx && (
        <div
          className="context-menu"
          style={{ left: ctxPos.x, top: ctxPos.y }}
          onMouseLeave={() => setShowCtx(false)}
        >
          <div className="context-menu-item" onClick={() => { duplicateTab(tab.id); setShowCtx(false); }}>
            <Globe size={14} /> Duplicate Tab
          </div>
          <div className="context-menu-item" onClick={() => { pinTab(tab.id); setShowCtx(false); }}>
            <Pin size={14} /> {tab.isPinned ? 'Unpin Tab' : 'Pin Tab'}
          </div>
          <div className="context-menu-item" onClick={() => { muteTab(tab.id); setShowCtx(false); }}>
            {tab.isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}
          </div>
          <div className="context-menu-item" onClick={() => { sleepTab(tab.id); setShowCtx(false); }}>
            <Moon size={14} /> {tab.isSleeping ? 'Wake Tab' : 'Put to Sleep'}
          </div>
          <div className="context-menu-sep" />
          <div className="context-menu-item danger" onClick={() => { onClose(tab.id); setShowCtx(false); }}>
            <X size={14} /> Close Tab
          </div>
        </div>
      )}
    </>
  );
}

export default function TabBar() {
  const { tabs, addTab, closeTab, setActiveTab } = useBrowserStore();
  const pinnedTabs = tabs.filter(t => t.isPinned);
  const normalTabs = tabs.filter(t => !t.isPinned);
  const windowApi = electronAPI;

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabList}>
        {/* Pinned tabs */}
        {pinnedTabs.length > 0 && (
          <div className={styles.pinnedSection}>
            {pinnedTabs.map(tab => (
              <TabItem key={tab.id} tab={tab} onClose={closeTab} onActivate={setActiveTab} />
            ))}
          </div>
        )}

        {/* Normal tabs */}
        <div className={styles.normalSection}>
          {normalTabs.map(tab => (
            <TabItem key={tab.id} tab={tab} onClose={closeTab} onActivate={setActiveTab} />
          ))}
          {/* Chrome-style new tab button attached directly to tabs */}
          <button
            className={styles.newTabBtn}
            onClick={() => addTab()}
            aria-label="New tab"
            title="New tab (Ctrl+T)"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Window Controls (Electron only) */}
      {isElectron && windowApi && (
        <div className={styles.windowControls}>
          <button className={styles.winBtn} onClick={() => windowApi.minimize()} title="Minimize">
            <Minus size={14} />
          </button>
          <button className={styles.winBtn} onClick={() => windowApi.maximize()} title="Maximize">
            <Square size={12} />
          </button>
          <button className={`${styles.winBtn} ${styles.winClose}`} onClick={() => windowApi.close()} title="Close">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
