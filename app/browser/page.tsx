'use client';
import { useEffect } from 'react';
import BrowserShell from '@/components/browser/BrowserShell';
import { initElectronBridge } from '@/store/browserStore';

export default function BrowserPage() {
  useEffect(() => {
    return initElectronBridge(); // no-op on web, wires IPC events in Electron
  }, []);
  return <BrowserShell />;
}
