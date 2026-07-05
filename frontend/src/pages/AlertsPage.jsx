import React, { useContext } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { listAlerts, acknowledgeAlert } from '../api/alerts.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import Badge from '../components/UI/Badge.jsx';
import Button from '../components/UI/Button.jsx';
import { Bell, Check } from 'lucide-react';
import { formatRelative, severityColor } from '../utils/format.js';
import { ToastContext } from '../context/ToastContext.js';
import styles from './AlertsPage.module.css';

function severityVariant(severity) {
  if (severity === 'critical') return 'danger';
  if (severity === 'warning')  return 'warning';
  return 'info';
}

export default function AlertsPage() {
  const { toast } = useContext(ToastContext);
  const { data, loading, error, execute } = useAsync(listAlerts, []);

  // Live update on new alert events
  useSocketEvent('budget_warning',  execute);
  useSocketEvent('budget_exceeded', execute);
  useSocketEvent('runaway_detected', execute);
  useSocketEvent('session_closed',  execute);

  const handleAck = async (id) => {
    try {
      await acknowledgeAlert(id);
      execute();
    } catch (err) {
      toast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;

  const alerts = data?.alerts ?? [];

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Alerts</h1>
        {alerts.length > 0 && (
          <span className={styles.count}>{alerts.length} unacknowledged</span>
        )}
      </header>

      {!alerts.length ? (
        <EmptyState icon={Bell} title="No unacknowledged alerts" description="All clear!" />
      ) : (
        <Card padding="none">
          <div className={styles.list}>
            {alerts.map((alert) => (
              <div key={alert.id} className={styles.row}>
                <div
                  className={styles.dot}
                  style={{ background: severityColor(alert.severity) }}
                />
                <div className={styles.content}>
                  <div className={styles.message}>{alert.message}</div>
                  <div className={styles.meta}>
                    <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                    <span className={styles.time}>{formatRelative(alert.createdAt)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAck(alert.id)}
                  title="Acknowledge alert"
                >
                  <Check size={14} aria-hidden="true" />
                  Ack
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
