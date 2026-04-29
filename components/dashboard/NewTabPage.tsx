'use client';
import { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { Search, Zap, Shield, Clock, TrendingUp, Plus } from 'lucide-react';
import styles from './NewTabPage.module.css';

interface HackerNewsItem {
  id: number;
  title?: string;
  url?: string;
  time?: number;
}

export default function NewTabPage() {
  const { navigate, setCommandPaletteOpen, speedDial, addSpeedDial, removeSpeedDial, timeStats, privacyScore, blockCount } = useBrowserStore();
  const [searchVal, setSearchVal] = useState('');
  const [news, setNews] = useState<Array<{title: string, source: string, time: string, category: string, url: string}>>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteTitle, setNewSiteTitle] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  
  useEffect(() => {
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(res => res.json())
      .then(ids => ids.slice(0, 4))
      .then(ids => Promise.all(ids.map((id: number) => 
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )))
      .then((items: HackerNewsItem[]) => setNews(items.map((item) => ({
        title: item.title ?? 'Untitled story',
        source: item.url ? new URL(item.url).hostname.replace('www.', '') : 'Hacker News',
        time: Math.floor((Date.now()/1000 - (item.time ?? Date.now()/1000)) / 3600) + 'h ago',
        category: 'Tech',
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`
      }))))
      .catch(console.error);
  }, []);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      const isUrl = searchVal.includes('.') && !searchVal.includes(' ');
      navigate(isUrl ? searchVal : `https://google.com/search?q=${encodeURIComponent(searchVal)}`);
    }
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteTitle.trim() || !newSiteUrl.trim()) return;
    
    let processedUrl = newSiteUrl;
    if (!/^https?:\/\//i.test(processedUrl)) processedUrl = `https://${processedUrl}`;

    addSpeedDial({
      title: newSiteTitle,
      url: processedUrl,
      icon: newSiteTitle.charAt(0).toUpperCase(),
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    });
    
    setNewSiteTitle('');
    setNewSiteUrl('');
    setShowAddSite(false);
  };

  return (
    <div className={styles.newTab}>
      {/* Animated background */}
      <div className={styles.bg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
      </div>

      <div className={styles.content}>
        {/* Clock & Date */}
        <div className={styles.clockSection}>
          <div className={styles.clock}>{timeStr}</div>
          <div className={styles.date}>{dateStr}</div>
        </div>

        {/* Search bar */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search anything or enter a URL..."
              className={styles.searchInput}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              autoFocus
            />
            <button type="button" className={styles.aiBtn} onClick={() => setCommandPaletteOpen(true)} title="AI Search">
              <Zap size={16} />
              <span>AI</span>
            </button>
          </div>
        </form>

        {/* Speed dial grid */}
        <div className={styles.speedDial}>
          <div className={styles.speedDialGrid}>
            {speedDial.map(site => (
              <div key={site.url} className={styles.speedItemWrap}>
                <button
                  className={styles.speedItem}
                  onClick={() => navigate(site.url)}
                  title={site.title}
                >
                  <div className={styles.speedIcon} style={{ background: site.color + '22' }}>
                    <img 
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(site.url).hostname}`} 
                      alt={site.title} 
                      width={32} 
                      height={32} 
                      style={{ borderRadius: '8px' }}
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        if ((e.target as HTMLImageElement).nextSibling) {
                          ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'block';
                        }
                      }} 
                    />
                    <span style={{ display: 'none' }}>{site.icon}</span>
                  </div>
                  <span className={styles.speedTitle}>{site.title}</span>
                </button>
                <button className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeSpeedDial(site.url); }} title="Remove">✕</button>
              </div>
            ))}
            <button className={`${styles.speedItem} ${styles.addSite}`} onClick={() => setShowAddSite(true)}>
              <div className={styles.speedIcon}>
                <Plus size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <span className={styles.speedTitle}>Add Site</span>
            </button>
          </div>
        </div>

        {/* Bottom widgets */}
        <div className={styles.widgets}>
          {/* Privacy stats */}
          <div className={`${styles.widget} glass-card`}>
            <div className={styles.widgetHeader}>
              <Shield size={16} style={{ color: 'var(--color-success)' }} />
              <span className={styles.widgetTitle}>Privacy Shield</span>
            </div>
            <div className={styles.shieldScore}>
              <div className={styles.scoreRing}>
                <svg viewBox="0 0 60 60" className={styles.scoreSvg}>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="var(--bg-overlay)" strokeWidth="4" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke="url(#scoreGrad)" strokeWidth="4"
                    strokeDasharray={`${(privacyScore / 100) * 150.8} 150.8`} strokeLinecap="round"
                    transform="rotate(-90 30 30)" />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6BCB77" />
                      <stop offset="100%" stopColor="#4ECDC4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.scoreValue}>{privacyScore}</div>
              </div>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statVal}>{blockCount.toLocaleString()}</span>
                <span className={styles.statLbl}>Blocked</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{Math.floor(blockCount * 0.15)}</span>
                <span className={styles.statLbl}>Trackers</span>
              </div>
            </div>
          </div>

          {/* News feed */}
          <div className={`${styles.widget} ${styles.newsWidget} glass-card`}>
            <div className={styles.widgetHeader}>
              <TrendingUp size={16} style={{ color: 'var(--brand-primary)' }} />
              <span className={styles.widgetTitle}>Top Stories</span>
            </div>
            <div className={styles.newsList}>
              {news.length > 0 ? news.map((item, i) => (
                <div key={i} className={styles.newsItem} onClick={() => navigate(item.url)} style={{cursor: 'pointer'}}>
                  <div className={`badge badge-primary ${styles.newsCat}`} style={{ fontSize: 10 }}>{item.category}</div>
                  <p className={styles.newsTitle}>{item.title}</p>
                  <div className={styles.newsMeta}>
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              )) : (
                <div style={{color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, fontSize: 13}}>Loading live stories...</div>
              )}
            </div>
          </div>

          {/* Time tracker */}
          <div className={`${styles.widget} glass-card`}>
            <div className={styles.widgetHeader}>
              <Clock size={16} style={{ color: 'var(--color-warning)' }} />
              <span className={styles.widgetTitle}>Today&apos;s Usage</span>
            </div>
            <div className={styles.timeStats}>
              {timeStats.map((s, i) => {
                const maxMins = Math.max(...timeStats.map(t => t.minutes), 1);
                return (
                <div key={i} className={styles.timeStat}>
                  <div className={styles.timeStatHeader}>
                    <span className={styles.timeSite}>{s.site}</span>
                    <span className={styles.timeVal}>{Math.floor(s.minutes/60)}h {s.minutes%60}m</span>
                  </div>
                  <div className={styles.timeBar}>
                    <div className={styles.timeBarFill} style={{ width: `${(s.minutes/maxMins)*100}%`, background: s.color }} />
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddSite && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSite(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>Add Speed Dial</div>
            <form onSubmit={handleAddSite}>
              <div className={styles.inputGroup}>
                <label>Website URL</label>
                <input 
                  type="text" 
                  className={styles.modalInput} 
                  placeholder="e.g. facebook.com"
                  value={newSiteUrl}
                  onChange={e => setNewSiteUrl(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Title</label>
                <input 
                  type="text" 
                  className={styles.modalInput} 
                  placeholder="e.g. Facebook"
                  value={newSiteTitle}
                  onChange={e => setNewSiteTitle(e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={`${styles.modalBtn} ${styles.btnCancel}`} onClick={() => setShowAddSite(false)}>Cancel</button>
                <button type="submit" className={`${styles.modalBtn} ${styles.btnAdd}`}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
