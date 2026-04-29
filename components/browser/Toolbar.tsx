'use client';
import { useBrowserStore } from '@/store/browserStore';
import {
  ChevronLeft, ChevronRight, RefreshCw, Home,
  Bot, Shield, Bookmark, History, Download,
  Settings, Puzzle, SplitSquareHorizontal,
  BookOpen, Focus, LayoutGrid, Archive,
  Smartphone, PenTool, Languages, PictureInPicture
} from 'lucide-react';
import styles from './Toolbar.module.css';
import ScreenshotButton from './ScreenshotButton';

export default function Toolbar() {
  const {
    tabs, activeTabId, goBack, goForward, reload, navigate,
    setActivePanel, activePanel,
    readingMode, setReadingMode,
    focusMode, setFocusMode,
    setSplitView, splitViewOpen,
    setTabCanvas, tabCanvasOpen,
  } = useBrowserStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={styles.toolbar}>
      {/* Navigation buttons */}
      <div className={styles.navGroup}>
        <button
          className={`btn-icon ${styles.navBtn}`}
          onClick={goBack}
          disabled={!activeTab?.canGoBack}
          title="Back (Alt+←)"
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className={`btn-icon ${styles.navBtn}`}
          onClick={goForward}
          disabled={!activeTab?.canGoForward}
          title="Forward (Alt+→)"
          aria-label="Go forward"
        >
          <ChevronRight size={18} />
        </button>
        <button
          className={`btn-icon ${styles.navBtn} ${activeTab?.isLoading ? styles.loading : ''}`}
          onClick={reload}
          title="Reload (Ctrl+R)"
          aria-label="Reload"
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={() => navigate('binks://newtab')}
          title="Home"
          aria-label="Home"
        >
          <Home size={16} />
        </button>
      </div>

      {/* Right actions */}
      <div className={styles.actionGroup}>
        <button
          className={`btn-icon ${activePanel === 'ai' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
          title="AI Co-Pilot"
          aria-label="AI assistant"
        >
          <Bot size={16} />
        </button>
        <button
          className={`btn-icon ${activePanel === 'privacy' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'privacy' ? null : 'privacy')}
          title="Privacy Shield"
          aria-label="Privacy"
        >
          <Shield size={16} />
        </button>
        <button
          className={`btn-icon ${readingMode ? 'active' : ''}`}
          onClick={() => setReadingMode(!readingMode)}
          title="Reading Mode"
          aria-label="Reading mode"
        >
          <BookOpen size={16} />
        </button>
        <button
          className={`btn-icon ${splitViewOpen ? 'active' : ''}`}
          onClick={() => setSplitView(!splitViewOpen)}
          title="Split View"
          aria-label="Split view"
        >
          <SplitSquareHorizontal size={16} />
        </button>
        <button
          className={`btn-icon ${tabCanvasOpen ? 'active' : ''}`}
          onClick={() => setTabCanvas(!tabCanvasOpen)}
          title="Tab Canvas"
          aria-label="Tab canvas"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          className="btn-icon"
          title="Seamless Cross-Device (Prototype)"
          onClick={() => alert("Cross-Device Handoff Initiated: Scan QR or open companion app.")}
        >
          <Smartphone size={16} />
        </button>
        <button
          className="btn-icon"
          title="Web Annotations (Prototype)"
          onClick={() => alert("Annotation Mode Enabled: Highlight text or click anywhere to leave a sticky note.")}
        >
          <PenTool size={16} />
        </button>
        <button
          className="btn-icon"
          title="Built-in Translator (Prototype)"
          onClick={() => alert("Full-page AI Translation activated. Translating to local language...")}
        >
          <Languages size={16} />
        </button>
        <button
          className="btn-icon"
          title="Picture-in-Picture 2.0 (Prototype)"
          onClick={() => alert("PiP 2.0: Detaching main media element into a floating window.")}
        >
          <PictureInPicture size={16} />
        </button>
        <button
          className={`btn-icon ${activePanel === 'session' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'session' ? null : 'session')}
          title="Session Manager"
          aria-label="Sessions"
        >
          <Archive size={16} />
        </button>
        <button
          className={`btn-icon ${focusMode ? 'active' : ''}`}
          onClick={() => setFocusMode(!focusMode)}
          title="Focus Mode"
          aria-label="Focus mode"
        >
          <Focus size={16} />
        </button>

        <div className={styles.divider} />

        {/* Screenshot */}
        <ScreenshotButton />

        <div className={styles.divider} />

        <button
          className={`btn-icon ${activePanel === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'bookmarks' ? null : 'bookmarks')}
          title="Bookmarks"
          aria-label="Bookmarks"
        >
          <Bookmark size={16} />
        </button>
        <button
          className={`btn-icon ${activePanel === 'history' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')}
          title="History"
          aria-label="History"
        >
          <History size={16} />
        </button>
        <button
          className={`btn-icon ${activePanel === 'downloads' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'downloads' ? null : 'downloads')}
          title="Downloads"
          aria-label="Downloads"
        >
          <Download size={16} />
        </button>
        <button
          className={`btn-icon ${activePanel === 'extensions' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'extensions' ? null : 'extensions')}
          title="Extensions"
          aria-label="Extensions"
        >
          <Puzzle size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={() => navigate('binks://settings')}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
