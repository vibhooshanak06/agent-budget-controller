import React from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { listUsageLogs } from '../api/usageLogs.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import Badge from '../components/UI/Badge.jsx';
import { FileText } from 'lucide-react';
import { formatCostShort, formatDate, formatTokens, formatLatency } from '../utils/format.js';
import styles from './TablePage.module.css';

export default function UsageLogsPage() {
  const { data, loading, error, execute } = useAsync(listUsageLogs, []);

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  if (!data?.logs?.length) {
    return <EmptyState icon={FileText} title="No usage logs" />;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Usage Logs</h1>
      </header>
      <Card padding="none">
        <div className={styles.table} style={{ '--col-template': '2fr 1.5fr 1fr 1fr 1fr 80px' }}>
          <div className={styles.thead}>
            <div className={styles.th}>Time</div>
            <div className={styles.th}>Model</div>
            <div className={styles.th}>Tokens</div>
            <div className={styles.th}>Cost</div>
            <div className={styles.th}>Latency</div>
            <div className={styles.th}>Status</div>
          </div>
          <div className={styles.tbody}>
            {data.logs.map((log) => (
              <div key={log.id} className={styles.tr}>
                <div className={styles.td}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatDate(log.createdAt)}
                  </div>
                  <div className={styles.slug}>{log.agent?.name}</div>
                </div>
                <div className={styles.td}>
                  <code style={{ fontSize: 11 }}>{log.model}</code>
                </div>
                <div className={styles.td}>{formatTokens(log.totalTokens)}</div>
                <div className={styles.td}>{formatCostShort(log.cost)}</div>
                <div className={styles.td}>{formatLatency(log.latencyMs)}</div>
                <div className={styles.td}>
                  <Badge variant={log.status === 'success' ? 'success' : 'danger'}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
