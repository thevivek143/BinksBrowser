'use client';
import { useEffect, useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { electronAPI, isElectron } from '@/lib/electron';
import Sidebar from './Sidebar';
import SidebarHandle from './SidebarHandle';
import TabBar from './TabBar';
import Toolbar from './Toolbar';
import AddressBar from './AddressBar';
import BookmarksBar from './BookmarksBar';
import ContentArea from './ContentArea';
import LoadingBar from './LoadingBar';
import CommandPalette from '@/components/features/CommandPalette';
import AIPanel from '@/components/panels/AIPanel';
import PrivacyPanel from '@/components/panels/PrivacyPanel';
import BookmarksPanel from '@/components/panels/BookmarksPanel';
import HistoryPanel from '@/components/panels/HistoryPanel';
import DownloadsPanel from '@/components/panels/DownloadsPanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import ExtensionsPanel from '@/components/panels/ExtensionsPanel';
import SessionPanel from '@/components/panels/SessionPanel';
import MobileShell from '@/components/mobile/MobileShell';
import styles from './BrowserShell.module.css';

export default function BrowserShell() {
  const {
    commandPaletteOpen, setCommandPaletteOpen,
    activePanel, focusMode, activeTabId,
    addTab, closeTab,
  } = useBrowserStore();

  // Hydration-safe mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      check();
    });
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', check);
    };
  }, []);

  // Report the real chrome height to Electron for pixel-perfect WebContentsView positioning
  useEffect(() => {
    if (!mounted || !isElectron || !electronAPI) return;
    const api = electronAPI;
    const reportHeight = () => {
      const contentArea = document.getElementById('browser-content-area');
      if (contentArea) {
        const rect = contentArea.getBoundingClientRect();
        if (rect.top > 0) api.setChromeHeight(Math.round(rect.top));
      }
    };
    // Use rAF so DOM has fully painted before measuring
    requestAnimationFrame(() => requestAnimationFrame(reportHeight));
    window.addEventListener('resize', reportHeight);
    return () => window.removeEventListener('resize', reportHeight);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(true); }
      if (mod && e.key === 't') { e.preventDefault(); addTab(); }
      if (mod && e.key === 'w') { e.preventDefault(); closeTab(activeTabId); }
      if (e.key === 'Escape') { setCommandPaletteOpen(false); }
      // Ctrl+Shift+S → open screenshot menu
      if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        (document.getElementById('screenshot-btn') as HTMLButtonElement)?.click();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mounted, activeTabId, addTab, closeTab, setCommandPaletteOpen]);

  // Simulate real-time metrics for prototype
  useEffect(() => {
    if (!mounted) return;
    
    // Block 0-2 trackers randomly every 5 seconds
    const blockInterval = setInterval(() => {
      useBrowserStore.getState().incrementBlockCount(Math.floor(Math.random() * 3));
    }, 5000);

    // Add 1 minute to the active site's usage every 10 seconds (accelerated for prototype)
    const usageInterval = setInterval(() => {
      useBrowserStore.getState().updateActiveTime();
    }, 10000);

    return () => {
      clearInterval(blockInterval);
      clearInterval(usageInterval);
    };
  }, [mounted]);

  // Render nothing until mounted to prevent hydration mismatch
  if (!mounted) return null;

  if (isMobile) return <MobileShell />;

  return (
    <div className={`${styles.shell} ${focusMode ? styles.focusMode : ''}`}>
      {/* Loading progress bar */}
      <LoadingBar />

      {/* Main layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content column */}
        <div className={styles.main} style={{ position: 'relative' }}>
          {/* Floating sidebar reveal handle — always visible when sidebar is hidden */}
          <SidebarHandle />

          {/* Tab bar */}
          <TabBar />

          {/* Address bar + toolbar row */}
          <div className={styles.toolbarRow}>
            <Toolbar />
            <AddressBar />
          </div>
          {/* Bookmarks bar */}
          <BookmarksBar />

          {/* Content area with optional right panel */}
          <div className={styles.contentRow}>
            <ContentArea />

            {activePanel === 'ai' && <AIPanel />}
            {activePanel === 'privacy' && <PrivacyPanel />}
            {activePanel === 'bookmarks' && <BookmarksPanel />}
            {activePanel === 'history' && <HistoryPanel />}
            {activePanel === 'downloads' && <DownloadsPanel />}
            {activePanel === 'settings' && <SettingsPanel />}
            {activePanel === 'extensions' && <ExtensionsPanel />}
            {activePanel === 'session' && <SessionPanel />}
          </div>
        </div>
      </div>

      {/* Command Palette overlay */}
      {commandPaletteOpen && <CommandPalette />}
    </div>
  );
}
