'use client';
import { useState, useEffect, useRef } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useDataStore } from '@/store/dataStore';
import { Search, Globe, Bookmark, History, Plus, ArrowRight, Bot, Settings, LayoutGrid } from 'lucide-react';
import styles from './CommandPalette.module.css';

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const { setCommandPaletteOpen, navigate, addTab, setActivePanel, setTabCanvas, setReadingMode, setFocusMode } = useBrowserStore();
  const { bookmarks, history } = useDataStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const baseCommands: CommandItem[] = [
    { id: 'new-tab', icon: <Plus size={15} />, label: 'New Tab', hint: 'Ctrl+T', action: () => { addTab(); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'ai', icon: <Bot size={15} />, label: 'Open AI Co-Pilot', hint: '', action: () => { setActivePanel('ai'); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'canvas', icon: <LayoutGrid size={15} />, label: 'Open Tab Canvas', hint: '', action: () => { setTabCanvas(true); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'reader', icon: <Globe size={15} />, label: 'Toggle Reading Mode', hint: '', action: () => { setReadingMode(true); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'focus', icon: <Globe size={15} />, label: 'Toggle Focus Mode', hint: '', action: () => { setFocusMode(true); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'settings', icon: <Settings size={15} />, label: 'Open Settings', hint: '', action: () => { setActivePanel('settings'); setCommandPaletteOpen(false); }, category: 'Actions' },
    { id: 'privacy', icon: <Globe size={15} />, label: 'Privacy Dashboard', hint: '', action: () => { setActivePanel('privacy'); setCommandPaletteOpen(false); }, category: 'Actions' },
    ...bookmarks.slice(0, 5).map(b => ({
      id: `bm-${b.id}`, icon: <Bookmark size={15} />, label: b.title, hint: b.url.replace(/^https?:\/\//, '').substring(0, 30),
      action: () => { navigate(b.url); setCommandPaletteOpen(false); }, category: 'Bookmarks',
    })),
    ...history.slice(0, 5).map(h => ({
      id: `hi-${h.id}`, icon: <History size={15} />, label: h.title, hint: h.url.replace(/^https?:\/\//, '').substring(0, 30),
      action: () => { navigate(h.url); setCommandPaletteOpen(false); }, category: 'History',
    })),
  ];

  const filtered = query
    ? baseCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.hint || '').toLowerCase().includes(query.toLowerCase())
      )
    : baseCommands;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleNav = () => {
    if (query.trim()) {
      const isUrl = query.includes('.') && !query.includes(' ');
      navigate(isUrl ? (query.startsWith('http') ? query : `https://${query}`) : `https://google.com/search?q=${encodeURIComponent(query)}`);
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setCommandPaletteOpen(false)}>
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className={styles.inputRow}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search commands, bookmarks, history..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setCommandPaletteOpen(false);
              if (e.key === 'Enter') handleNav();
            }}
          />
          <kbd className={styles.esc}>ESC</kbd>
        </div>

        {/* Navigate option */}
        {query && (
          <button className={`${styles.item} ${styles.navigateItem}`} onClick={handleNav}>
            <ArrowRight size={15} style={{ color: 'var(--brand-primary)' }} />
            <span>Navigate to <strong>{query}</strong></span>
          </button>
        )}

        {/* Commands */}
        <div className={styles.results}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className={styles.group}>
              <div className={styles.groupLabel}>{cat}</div>
              {items.map(item => (
                <button key={item.id} className={styles.item} onClick={item.action}>
                  <span className={styles.itemIcon}>{item.icon}</span>
                  <span className={styles.itemLabel}>{item.label}</span>
                  {item.hint && <span className={styles.itemHint}>{item.hint}</span>}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>No results for &quot;{query}&quot;</div>
          )}
        </div>

        <div className={styles.footer}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
