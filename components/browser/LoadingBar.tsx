'use client';
import { useBrowserStore } from '@/store/browserStore';
import styles from './LoadingBar.module.css';

export default function LoadingBar() {
  const { tabs, activeTabId } = useBrowserStore();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab?.isLoading) return null;

  return (
    <div className={styles.loadingBar}>
      <div className={styles.progress} style={{ width: `${activeTab.loadProgress}%` }} />
    </div>
  );
}
