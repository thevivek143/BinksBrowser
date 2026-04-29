'use client';
import { useBrowserStore } from '@/store/browserStore';
import { electronAPI, isElectron } from '@/lib/electron';
import { ChevronRight } from 'lucide-react';

/**
 * A thin floating tab pinned to the left edge of the content area.
 * Visible ONLY when the sidebar is collapsed (width=0).
 * Clicking it expands the sidebar.
 */
export default function SidebarHandle() {
  const { sidebarCollapsed, setSidebarCollapsed } = useBrowserStore();

  if (!sidebarCollapsed) return null;

  return (
    <button
      onClick={() => {
        setSidebarCollapsed(false);
        if (isElectron && electronAPI) electronAPI.setSidebarWidth(240);
      }}
      title="Open Sidebar"
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 52,
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: 0,
        transition: 'all 0.15s ease',
        boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.width = '24px';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-primary)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.width = '18px';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
    >
      <ChevronRight size={12} />
    </button>
  );
}
