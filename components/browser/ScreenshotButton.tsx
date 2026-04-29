'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Camera, Monitor, AppWindow, Scissors, X, Download, Copy, FolderOpen, Check, Loader2, ChevronRight } from 'lucide-react';
import { useBrowserStore } from '@/store/browserStore';
import { electronAPI, isElectron, type ScreenshotResponse } from '@/lib/electron';
import styles from './ScreenshotButton.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'fullscreen' | 'window' | 'region';

type CaptureResult = {
  base64: string;
  mode: Mode;
};

type SaveResult = {
  filePath?: string;
  error?: string;
};

// ─── Save Modal ───────────────────────────────────────────────────────────────

function SaveModal({
  result,
  onClose,
}: {
  result: CaptureResult;
  onClose: () => void;
}) {
  const [filename,  setFilename]  = useState(() => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `BinksBrowser_${ts}`;
  });
  const [format,    setFormat]    = useState<'png' | 'jpg'>('png');
  const [saving,    setSaving]    = useState(false);
  const [copying,   setCopying]   = useState(false);
  const [saved,     setSaved]     = useState<SaveResult | null>(null);
  const [copied,    setCopied]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(null);
    try {
      const fname = `${filename || 'screenshot'}.${format}`;
      if (isElectron && electronAPI) {
        const res = await electronAPI.screenshotSave(result.base64, fname);
        if (res?.success) setSaved({ filePath: res.filePath });
        else if (!res?.canceled) setSaved({ error: res?.error ?? 'Unknown error' });
      } else {
        // Web fallback: trigger download
        const a = document.createElement('a');
        a.href = result.base64;
        a.download = fname;
        a.click();
        setSaved({ filePath: fname });
      }
    } finally {
      setSaving(false);
    }
  }, [filename, format, result.base64]);

  const handleCopy = useCallback(async () => {
    setCopying(true);
    try {
      if (isElectron && electronAPI) {
        await electronAPI.screenshotCopy(result.base64);
      } else {
        const res  = await fetch(result.base64);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } finally {
      setCopying(false);
    }
  }, [result.base64]);

  const openFolder = () => {
    if (saved?.filePath && isElectron && electronAPI) {
      electronAPI.screenshotShowFile(saved.filePath);
    }
  };

  const modeLabel: Record<Mode, string> = {
    fullscreen: 'Full Screen',
    window:     'Browser Window',
    region:     'Selected Region',
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Camera size={16} />
            Screenshot — {modeLabel[result.mode]}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {/* Preview */}
        <div className={styles.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.base64}
            alt="Screenshot preview"
            className={styles.preview}
          />
          <div className={styles.previewBadge}>
            {modeLabel[result.mode]}
          </div>
        </div>

        {/* Save options */}
        <div className={styles.saveSection}>

          {/* Filename row */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Filename</label>
            <div className={styles.filenameWrap}>
              <input
                ref={inputRef}
                className={styles.filenameInput}
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="screenshot"
                spellCheck={false}
              />
              <span className={styles.ext}>.{format}</span>
            </div>
          </div>

          {/* Format row */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Format</label>
            <div className={styles.formatBtns}>
              {(['png', 'jpg'] as const).map(f => (
                <button
                  key={f}
                  className={`${styles.formatBtn} ${format === f ? styles.formatBtnActive : ''}`}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${styles.copyBtn} ${copied ? styles.successBtn : ''}`}
              onClick={handleCopy}
              disabled={copying}
            >
              {copying
                ? <Loader2 size={14} className={styles.spin} />
                : copied
                  ? <Check size={14} />
                  : <Copy size={14} />
              }
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              className={`${styles.actionBtn} ${styles.saveBtn} ${saved?.filePath ? styles.successBtn : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <Loader2 size={14} className={styles.spin} />
                : saved?.filePath
                  ? <Check size={14} />
                  : <Download size={14} />
              }
              {saved?.filePath ? 'Saved!' : 'Save to File'}
            </button>
          </div>

          {/* Save feedback */}
          {saved?.filePath && (
            <div className={styles.savedRow}>
              <span className={styles.savedPath} title={saved.filePath}>
                📁 {saved.filePath.split(/[\\/]/).slice(-2).join('/')}
              </span>
              <button className={styles.showFolder} onClick={openFolder}>
                <FolderOpen size={12} /> Show
              </button>
            </div>
          )}
          {saved?.error && (
            <div className={styles.errorRow}>⚠ {saved.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mode selector panel ──────────────────────────────────────────────────────

const MODES: { id: Mode; icon: React.ReactNode; label: string; sub: string; shortcut: string }[] = [
  {
    id:       'fullscreen',
    icon:     <Monitor  size={22} />,
    label:    'Full Screen',
    sub:      'Capture the entire display',
    shortcut: '⇧F',
  },
  {
    id:       'window',
    icon:     <AppWindow size={22} />,
    label:    'Browser Window',
    sub:      'Capture the active tab content',
    shortcut: '⇧W',
  },
  {
    id:       'region',
    icon:     <Scissors  size={22} />,
    label:    'Select Region',
    sub:      'Draw to choose an area',
    shortcut: '⇧R',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScreenshotButton() {
  const { activeTabId } = useBrowserStore();
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [capturing,    setCapturing]    = useState<Mode | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setPanelOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const capture = useCallback(async (mode: Mode) => {
    setPanelOpen(false);
    setCapturing(mode);
    try {
      let result: ScreenshotResponse;

      if (isElectron && electronAPI) {
        if (mode === 'fullscreen') {
          result = await electronAPI.screenshotFullscreen();
        } else if (mode === 'window') {
          result = await electronAPI.screenshotWindow(activeTabId);
        } else {
          result = await electronAPI.screenshotRegion();
        }
      } else {
        // Web fallback: notify user to use desktop app
        result = { error: 'Full screenshot support requires the Desktop EXE (Electron).' };
      }

      if (result?.success && result.base64) {
        if (result.copyOnly) {
          // Region "Copy" button was clicked — copy directly without save modal
          if (isElectron && electronAPI) await electronAPI.screenshotCopy(result.base64);
        } else {
          setCaptureResult({ base64: result.base64, mode });
        }
      } else if (result?.error) {
        console.error('[screenshot]', result.error);
      }
    } finally {
      setCapturing(null);
    }
  }, [activeTabId]);

  // Keyboard shortcuts when panel is open
  useEffect(() => {
    if (!panelOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'f') capture('fullscreen');
      if (e.shiftKey && e.key.toLowerCase() === 'w') capture('window');
      if (e.shiftKey && e.key.toLowerCase() === 'r') capture('region');
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, capture]);

  return (
    <>
      {/* ── Camera button ── */}
      <div className={styles.wrapper} ref={panelRef}>
        <button
          id="screenshot-btn"
          className={`btn-icon ${styles.camBtn} ${panelOpen ? 'active' : ''}`}
          onClick={() => setPanelOpen(o => !o)}
          title="Screenshot (Ctrl+Shift+S)"
          aria-label="Take screenshot"
          aria-expanded={panelOpen}
          disabled={!!capturing}
        >
          {capturing
            ? <Loader2 size={16} className={styles.spin} />
            : <Camera   size={16} />
          }
          {capturing && (
            <span className={styles.capturingLabel}>
              {capturing === 'fullscreen' ? 'Capturing…' : capturing === 'region' ? 'Select area…' : 'Capturing…'}
            </span>
          )}
        </button>

        {/* ── Mode selector panel ── */}
        {panelOpen && (
          <div className={styles.panel} role="menu">
            <div className={styles.panelHeader}>
              <Camera size={13} />
              <span>Screenshot</span>
              <span className={styles.panelSub}>Choose capture mode</span>
            </div>

            {MODES.map(m => (
              <button
                key={m.id}
                className={styles.modeBtn}
                onClick={() => capture(m.id)}
                role="menuitem"
              >
                <span className={styles.modeIcon}>{m.icon}</span>
                <span className={styles.modeText}>
                  <span className={styles.modeLabel}>{m.label}</span>
                  <span className={styles.modeSub}>{m.sub}</span>
                </span>
                <kbd className={styles.modeKbd}>{m.shortcut}</kbd>
                <ChevronRight size={14} className={styles.modeArrow} />
              </button>
            ))}

            <div className={styles.panelFooter}>
              <kbd>Ctrl+Shift+S</kbd> to open · <kbd>Esc</kbd> to close
            </div>
          </div>
        )}
      </div>

      {/* ── Save modal ── */}
      {captureResult && (
        <SaveModal
          result={captureResult}
          onClose={() => setCaptureResult(null)}
        />
      )}
    </>
  );
}
