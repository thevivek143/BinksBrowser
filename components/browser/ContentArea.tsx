'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { isElectron } from '@/lib/electron';
import NewTabPage from '@/components/dashboard/NewTabPage';
import SettingsPage from '@/components/dashboard/SettingsPage';
import ReadingMode from '@/components/features/ReadingMode';
import styles from './ContentArea.module.css';

// ─── URL intelligence ─────────────────────────────────────────────────────────

function getYouTubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const match = u.pathname.match(/\/embed\/([^/?]+)/);
      if (match) return match[1];
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] || null;
    }
  } catch {}
  return null;
}

type SiteKind =
  | { type: 'newtab' }
  | { type: 'youtube'; embedId: string }
  | { type: 'iframe'; url: string }
  | { type: 'blocked'; url: string; domain: string }
  | { type: 'settings' }
  | { type: 'invalid' };

// Sites definitively known to refuse ALL iframe embedding (security policy)
// These open via the native Electron WebContentsView anyway — this list
// only matters in the fallback web-preview (e.g., running in a plain browser).
const HARD_BLOCKED = [
  'accounts.google.com',
  'mail.google.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'netflix.com',
  'discord.com',
  'whatsapp.com',
];

function classifyUrl(url: string): SiteKind {
  if (!url || url === 'binks://newtab') return { type: 'newtab' };
  if (url === 'binks://settings') return { type: 'settings' };
  if (!url.startsWith('http')) return { type: 'invalid' };

  const ytId = getYouTubeEmbedId(url);
  if (ytId) return { type: 'youtube', embedId: ytId };

  try {
    const u = new URL(url);
    const domain = u.hostname.replace(/^www\./, '');
    // Only hard-block a handful of sites that are known to cause error pages
    if (HARD_BLOCKED.some(d => domain === d || domain.endsWith('.' + d))) {
      return { type: 'blocked', url, domain };
    }
    // Let everything else attempt to load — Electron strips X-Frame headers
    return { type: 'iframe', url };
  } catch {
    return { type: 'invalid' };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function YouTubeFrame({ embedId }: { embedId: string }) {
  return (
    <iframe
      className={styles.webView}
      src={`https://www.youtube.com/embed/${embedId}?autoplay=0&rel=0`}
      title="YouTube Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function SmartIframe({ url, tabId }: { url: string; tabId: string }) {
  const { updateTab } = useBrowserStore();
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const blocked = blockedUrl === url;

  if (blocked) {
    let domain = url;
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
    return <BlockedPage url={url} domain={domain} />;
  }

  return (
    <iframe
      className={styles.webView}
      src={url}
      title="Web Content"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      onLoad={() => updateTab(tabId, { isLoading: false, loadProgress: 100 })}
      onError={() => {
        updateTab(tabId, { isLoading: false });
        setBlockedUrl(url);
      }}
    />
  );
}

function BlockedPage({ url, domain }: { url: string; domain: string }) {
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${url}`;

  return (
    <div className={styles.blockedPage}>
      <div className={styles.blockedGlow} />
      <div className={styles.blockedContent}>
        {/* Site icon */}
        <div className={styles.blockedSiteIcon}>
          <img src={faviconUrl} alt={domain} width={40} height={40}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>

        {/* Shield icon */}
        <div className={styles.blockedShield}>🛡️</div>

        <h2 className={styles.blockedTitle}>{domain}</h2>
        <p className={styles.blockedSubtitle}>refused to connect</p>

        <div className={styles.blockedExplainer}>
          <div className={styles.blockedDetail}>
            <span className={styles.blockedDetailIcon}>⚠️</span>
            <div>
              <div className={styles.blockedDetailTitle}>X-Frame-Options Blocked</div>
              <div className={styles.blockedDetailDesc}>
                {domain} uses <code>X-Frame-Options: SAMEORIGIN</code> or <code>Content-Security-Policy: frame-ancestors</code> headers to prevent embedding. This is a security feature — not a BinksBrowser bug.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.blockedActions}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Open in Real Browser →
          </a>
          <button
            className="btn btn-surface"
            onClick={() => navigator.clipboard?.writeText(url)}
          >
            Copy URL
          </button>
        </div>

        <p className={styles.blockedNote}>
          💡 BinksBrowser is a UI prototype built with Next.js. Real browser embedding requires a native engine (Chromium / Electron / WebExtensions API).
        </p>
      </div>
    </div>
  );
}

function InvalidPage() {
  return (
    <div className={styles.blockedPage}>
      <div className={styles.blockedContent}>
        <div className={styles.blockedShield}>❓</div>
        <h2 className={styles.blockedTitle}>Invalid URL</h2>
        <p className={styles.blockedSubtitle}>Please enter a valid web address in the address bar.</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function WebFrame({ url, tabId }: { url: string; tabId: string }) {
  const kind = classifyUrl(url);

  if (isElectron) {
    if (kind.type === 'newtab') return <NewTabPage />;
    if (kind.type === 'settings') return <SettingsPage />;
    if (kind.type === 'invalid') return <InvalidPage />;
    return <div style={{ width: '100%', height: '100%', background: 'transparent' }} />;
  }

  switch (kind.type) {
    case 'newtab':    return <NewTabPage />;
    case 'settings':  return <SettingsPage />;
    case 'youtube':   return <YouTubeFrame embedId={kind.embedId} />;
    case 'iframe':    return <SmartIframe url={kind.url} tabId={tabId} />;
    case 'blocked':   return <BlockedPage url={kind.url} domain={kind.domain} />;
    case 'invalid':   return <InvalidPage />;
  }
}

export default function ContentArea() {
  const { tabs, activeTabId, readingMode, splitViewOpen, splitTabId } = useBrowserStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const splitTab  = tabs.find(t => t.id === splitTabId);

  if (!activeTab) return null;

  return (
    <div id="browser-content-area" className={styles.contentArea}>
      {readingMode ? (
        <ReadingMode url={activeTab.url} title={activeTab.title} />
      ) : (
        <div className={`${styles.webContent} ${splitViewOpen && splitTab ? styles.split : ''}`}>
          {/* Primary frames: Render ALL tabs to keep background state alive */}
          {tabs.map(tab => (
            <div 
              key={tab.id} 
              className={styles.webFrame}
              style={{ 
                display: tab.id === activeTabId ? 'flex' : 'none',
                width: '100%', height: '100%' 
              }}
            >
              <WebFrame url={tab.url} tabId={tab.id} />
            </div>
          ))}

          {/* Split view */}
          {splitViewOpen && splitTab && (
            <div className={styles.webFrame} style={{ borderLeft: '2px solid var(--glass-border)', display: 'flex' }}>
              <WebFrame url={splitTab.url} tabId={splitTab.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
