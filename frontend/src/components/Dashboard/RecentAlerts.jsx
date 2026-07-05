import React from 'react';
import { formatRelative } from '../../utils/format.js';
import { severityColor } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { Bell } from 'lucide-react';
import styles from './RecentAlerts.module.css';

export default function RecentAlerts({ alerts = [] }) {
  if (!alerts.length) {
    return <EmptyState icon={Bell} title="No recent alerts" description="All clear!" />;
  }

  return (
    <div className={styles.list}>
      {alerts.map((alert) => (
        <div key={alert.id} className={styles.row}>
          <div className={styles.indicator} style={{ background: severityColor(alert.severity) }} />
          <div className={styles.info}>
            <div className={styles.message}>{alert.message}</div>
            <div className={styles.meta}>{formatRelative(alert.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
