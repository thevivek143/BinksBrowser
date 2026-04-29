'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { Archive, Plus, Trash2, Clock, Layers, Play } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  tabCount: number;
  savedAt: number;
  preview: string[];
}

const SAMPLE_SESSIONS: Session[] = [
  {
    id: 's1', name: 'Morning Work Session', tabCount: 7, savedAt: Date.now() - 3600000,
    preview: ['github.com', 'vercel.com', 'nextjs.org', '+4 more'],
  },
  {
    id: 's2', name: 'Research: AI Browsers', tabCount: 5, savedAt: Date.now() - 86400000,
    preview: ['techcrunch.com', 'wired.com', 'arcs.com', '+2 more'],
  },
  {
    id: 's3', name: 'Design Sprint', tabCount: 4, savedAt: Date.now() - 172800000,
    preview: ['figma.com', 'dribbble.com', 'behance.net', '+1 more'],
  },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function SessionPanel() {
  const { setActivePanel, tabs } = useBrowserStore();
  const [sessions, setSessions] = useState<Session[]>(SAMPLE_SESSIONS);

  const saveCurrentSession = () => {
    const newSession: Session = {
      id: Math.random().toString(36).slice(2),
      name: `Session — ${new Date().toLocaleTimeString()}`,
      tabCount: tabs.length,
      savedAt: Date.now(),
      preview: tabs.slice(0, 3).map(t => t.url.replace(/^https?:\/\//, '').split('/')[0]),
    };
    setSessions(prev => [newSession, ...prev]);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const restoreSession = (session: Session) => {
    // Basic restore logic: open the preview tabs
    session.preview.forEach(url => {
      if (!url.startsWith('+')) {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        useBrowserStore.getState().addTab(fullUrl);
      }
    });
    setActivePanel(null);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Archive size={16} style={{ color: 'var(--color-warning)' }} />
          <span className="panel-title">Session Manager</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)}>✕</button>
      </div>

      {/* Save current */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{
          background: 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Layers size={14} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Current Session</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            {tabs.length} open tab{tabs.length !== 1 ? 's' : ''} — save this session to restore it later
          </p>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: 12 }} onClick={saveCurrentSession}>
            <Plus size={14} /> Save Current Session
          </button>
        </div>
      </div>

      <div className="panel-body scroll-area">
        <p className="section-label">Saved Sessions</p>

        {sessions.map(session => (
          <div key={session.id} style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {session.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <Layers size={11} />
                  <span>{session.tabCount} tabs</span>
                  <Clock size={11} />
                  <span>{timeAgo(session.savedAt)}</span>
                </div>
              </div>
              <button className="btn-icon" style={{ width: 24, height: 24, flexShrink: 0 }}
                onClick={() => deleteSession(session.id)} title="Delete">
                <Trash2 size={12} />
              </button>
            </div>

            {/* Tab preview pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {session.preview.map((p, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: '2px 8px',
                  background: 'var(--bg-overlay)', borderRadius: 'var(--radius-full)',
                  color: 'var(--text-muted)', border: '1px solid var(--glass-border)',
                }}>{p}</span>
              ))}
            </div>

            <button 
              className="btn btn-surface" 
              style={{ width: '100%', fontSize: 11, gap: 6 }}
              onClick={() => restoreSession(session)}
            >
              <Play size={11} /> Restore Session
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No saved sessions yet
          </p>
        )}
      </div>
    </div>
  );
}

