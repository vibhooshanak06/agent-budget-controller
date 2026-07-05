import React from 'react';
import { formatCostShort, formatRelative } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { FileText } from 'lucide-react';
import styles from './RecentUsage.module.css';

export default function RecentUsage({ logs = [] }) {
  if (!logs.length) {
    return <EmptyState icon={FileText} title="No usage logs" />;
  }

  return (
    <div className={styles.list}>
      {logs.map((log) => (
        <div key={log.id} className={styles.row}>
          <div className={styles.info}>
            <div className={styles.agent}>{log.agent?.name ?? 'Unknown'}</div>
            <div className={styles.meta}>
              {log.model} · {formatRelative(log.createdAt)}
            </div>
          </div>
          <span className={styles.cost}>{formatCostShort(log.cost)}</span>
        </div>
      ))}
    </div>
  );
}
