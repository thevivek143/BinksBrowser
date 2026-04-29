'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { Bookmark, ArrowLeft, ArrowRight, Plus, X, Globe } from 'lucide-react';
import styles from './MobileShell.module.css';
import ContentArea from '@/components/browser/ContentArea';

export default function MobileShell() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, navigate, goBack, goForward } = useBrowserStore();
  const [tabSwitcherOpen, setTabSwitcherOpen] = useState(false);
  const [urlBarValue, setUrlBarValue] = useState('');
  const [urlFocused, setUrlFocused] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isNewTab = activeTab?.url === 'binks://newtab';

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlBarValue.trim()) return;
    const isUrl = urlBarValue.includes('.') && !urlBarValue.includes(' ');
    navigate(isUrl ? urlBarValue : `https://google.com/search?q=${encodeURIComponent(urlBarValue)}`);
    setUrlFocused(false);
  };

  return (
    <div className={styles.mobileShell}>
      {/* Content area */}
      <div className={styles.content}>
        <ContentArea />
      </div>

      {/* Loading bar */}
      {activeTab?.isLoading && (
        <div className={styles.loadBar}>
          <div className={styles.loadFill} style={{ width: `${activeTab.loadProgress}%` }} />
        </div>
      )}

      {/* Address bar */}
      <div className={styles.addressBarRow}>
        <form className={`${styles.addressBar} ${urlFocused ? styles.focused : ''}`} onSubmit={handleNavigate}>
          <Globe size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            className={styles.urlInput}
            value={urlFocused ? urlBarValue : (isNewTab ? '' : (activeTab?.url?.replace(/^https?:\/\//, '').split('/')[0] || ''))}
            onChange={e => setUrlBarValue(e.target.value)}
            onFocus={() => { setUrlFocused(true); setUrlBarValue(activeTab?.url || ''); }}
            onBlur={() => setTimeout(() => setUrlFocused(false), 150)}
            placeholder="Search or enter address"
          />
          {urlFocused && urlBarValue && (
            <button type="button" className={styles.clearBtn} onMouseDown={() => setUrlBarValue('')}>
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      {/* Bottom toolbar */}
      <div className={styles.bottomBar}>
        <button className={styles.barBtn} onClick={goBack} disabled={!activeTab?.canGoBack}>
          <ArrowLeft size={20} />
        </button>
        <button className={styles.barBtn} onClick={goForward} disabled={!activeTab?.canGoForward}>
          <ArrowRight size={20} />
        </button>
        <button className={styles.barBtn} onClick={() => addTab()}>
          <Plus size={20} />
        </button>
        <button className={styles.barBtn} onClick={() => setTabSwitcherOpen(!tabSwitcherOpen)}>
          <div className={styles.tabCount}>{tabs.length}</div>
        </button>
        <button className={styles.barBtn}>
          <Bookmark size={20} />
        </button>
      </div>

      {/* Tab Switcher */}
      {tabSwitcherOpen && (
        <div className={styles.tabSwitcher}>
          <div className={styles.tabSwitcherHeader}>
            <span className={styles.tabSwitcherTitle}>{tabs.length} Tabs</span>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => { addTab(); setTabSwitcherOpen(false); }}>
              New Tab
            </button>
          </div>
          <div className={styles.tabGrid}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`${styles.tabCard} ${tab.id === activeTabId ? styles.tabCardActive : ''}`}
                onClick={() => { setActiveTab(tab.id); setTabSwitcherOpen(false); }}
              >
                <button
                  className={styles.tabCardClose}
                  onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                >
                  <X size={12} />
                </button>
                <div className={styles.tabCardFavicon}>
                  {tab.favicon ? (
                    <img src={tab.favicon} alt="" width={20} height={20} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  ) : (
                    <Globe size={18} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className={styles.tabCardTitle}>{tab.title || 'New Tab'}</div>
                <div className={styles.tabCardUrl}>{tab.url.replace(/^https?:\/\//, '').substring(0,25)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
