'use client';
import { useState, useRef } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useSettingsStore, getSearchUrl } from '@/store/settingsStore';
import { useDataStore } from '@/store/dataStore';
import { Search, Lock, AlertTriangle, Star, Share2, RefreshCw, X, Mic } from 'lucide-react';
import styles from './AddressBar.module.css';

const QUICK_SUGGESTIONS = [
  { icon: '🔍', label: 'Search Google', url: 'https://google.com' },
  { icon: '📁', label: 'github.com', url: 'https://github.com' },
  { icon: '📖', label: 'developer.mozilla.org', url: 'https://developer.mozilla.org' },
  { icon: '⚡', label: 'vercel.com', url: 'https://vercel.com' },
];

export default function AddressBar() {
  const { tabs, activeTabId, navigate, reload } = useBrowserStore();
  const { searchEngine } = useSettingsStore();
  const { history, bookmarks } = useDataStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = activeTab?.url === 'binks://newtab' ? '' : activeTab?.url || '';
  const isHttps = displayUrl.startsWith('https://');
  const isHttp = displayUrl.startsWith('http://') && !displayUrl.startsWith('https://');
  const domain = displayUrl.replace(/^https?:\/\//, '').split('/')[0];

  const handleFocus = () => {
    setFocused(true);
    setValue(displayUrl);
    setShowSuggestions(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handleBlur = () => {
    setFocused(false);
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const navigateInput = (input: string) => {
    if (!input.trim()) return;
    const trimmed = input.trim();
    // If it looks like a URL (has a dot, no spaces)
    if (/^https?:\/\//i.test(trimmed)) {
      navigate(trimmed);
    } else if (trimmed.includes('.') && !trimmed.includes(' ')) {
      navigate(`https://${trimmed}`);
    } else {
      // Use the centralized search engine from settings
      navigate(getSearchUrl(searchEngine, trimmed));
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateInput(value);
  };

  const handleSuggestionClick = (url: string) => {
    navigate(url);
    setShowSuggestions(false);
  };

  // Compute dynamic suggestions
  const lowerValue = value.toLowerCase();
  const historyMatches = history.filter(h => h.title.toLowerCase().includes(lowerValue) || h.url.toLowerCase().includes(lowerValue)).slice(0, 3);
  const bookmarkMatches = bookmarks.filter(b => b.title.toLowerCase().includes(lowerValue) || b.url.toLowerCase().includes(lowerValue)).slice(0, 2);
  const activeTabMatches = tabs.filter(t => t.id !== activeTabId && ((t.title && t.title.toLowerCase().includes(lowerValue)) || (t.url && t.url.toLowerCase().includes(lowerValue)))).slice(0, 2);

  return (
    <div className={styles.addressBarWrapper}>
      <form className={`${styles.addressBar} ${focused ? styles.focused : ''}`} onSubmit={handleSubmit}>
        {/* Security icon */}
        <div className={styles.securityIcon}>
          {focused ? (
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
          ) : isHttps ? (
            <Lock size={14} style={{ color: 'var(--color-success)' }} />
          ) : isHttp ? (
            <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
          ) : (
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={focused ? value : displayUrl ? domain : ''}
          onChange={e => setValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search or enter address..."
          spellCheck={false}
          autoComplete="off"
          id="address-bar"
          aria-label="Address bar"
        />

        {/* Loading indicator */}
        {activeTab?.isLoading && (
          <button type="button" className={styles.actionBtn} onClick={reload} title="Stop loading">
            <X size={14} />
          </button>
        )}

        {/* Actions (shown when not focused) */}
        {!focused && displayUrl && (
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} title="Voice Navigation (Prototype)" onClick={() => alert("Listening for voice commands... (e.g. 'Go to Google', 'Scroll down')")}>
              <Mic size={14} />
            </button>
            <button type="button" className={styles.actionBtn} title="Reload (Ctrl+R)" onClick={reload}>
              <RefreshCw size={14} />
            </button>
            <button type="button" className={styles.actionBtn} title="Bookmark">
              <Star size={14} />
            </button>
            <button type="button" className={styles.actionBtn} title="Share">
              <Share2 size={14} />
            </button>
          </div>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && focused && (
        <div className={styles.suggestions}>
          {value && (
            <div className={styles.suggestionItem} onMouseDown={() => navigateInput(value)}>
              <Search size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>Search for <strong>{value}</strong></span>
            </div>
          )}

          {/* Open Tabs */}
          {activeTabMatches.length > 0 && activeTabMatches.map(t => (
            <div key={'tab'+t.id} className={styles.suggestionItem} onMouseDown={() => { useBrowserStore.getState().setActiveTab(t.id); setShowSuggestions(false); }}>
              <span style={{ fontSize: 14 }}>📑</span>
              <span>Switch to tab: {t.title}</span>
              <span className={styles.suggestionUrl}>{t.url}</span>
            </div>
          ))}

          {/* Bookmarks */}
          {bookmarkMatches.length > 0 && bookmarkMatches.map(b => (
            <div key={'bm'+b.id} className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(b.url)}>
              <span style={{ fontSize: 14 }}>⭐</span>
              <span>{b.title}</span>
              <span className={styles.suggestionUrl}>{b.url}</span>
            </div>
          ))}

          {/* History */}
          {historyMatches.length > 0 && historyMatches.map(h => (
            <div key={'hist'+h.id} className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(h.url)}>
              <span style={{ fontSize: 14 }}>🕒</span>
              <span>{h.title || h.url}</span>
              <span className={styles.suggestionUrl}>{h.url}</span>
            </div>
          ))}

          {/* Fallback Defaults */}
          {!value && QUICK_SUGGESTIONS.map(s => (
            <div key={s.url} className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(s.url)}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <span>{s.label}</span>
              <span className={styles.suggestionUrl}>{s.url}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
