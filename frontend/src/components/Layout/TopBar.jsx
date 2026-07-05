import React from 'react';
import { useSocket } from '../../hooks/useSocket.js';
import { Wifi, WifiOff } from 'lucide-react';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { connected } = useSocket();

  return (
    <header className={styles.topbar}>
      <div className={styles.spacer} />
      <div className={styles.status}>
        {connected ? (
          <div className={styles.indicator} title="Connected to server">
            <Wifi size={14} aria-hidden="true" />
            <span>Connected</span>
          </div>
        ) : (
          <div className={`${styles.indicator} ${styles.disconnected}`} title="Disconnected from server">
            <WifiOff size={14} aria-hidden="true" />
            <span>Disconnected</span>
          </div>
        )}
      </div>
    </header>
  );
}
