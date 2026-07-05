import React, { useContext } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { listSessions, closeSession } from '../api/sessions.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import Badge from '../components/UI/Badge.jsx';
import Button from '../components/UI/Button.jsx';
import { MessageSquare, XCircle } from 'lucide-react';
import { formatCostShort, formatDate, formatTokens } from '../utils/format.js';
import { ToastContext } from '../context/ToastContext.js';
import styles from './TablePage.module.css';

function sessionBadge(status) {
  if (status === 'active') return 'success';
  if (status === 'closed') return 'neutral';
  if (status === 'terminated') return 'danger';
  return 'neutral';
}

export default function SessionsPage() {
  const { toast } = useContext(ToastContext);
  const { data, loading, error, execute } = useAsync(listSessions, []);

  const handleClose = async (id) => {
    try {
      await closeSession(id);
      toast({ title: 'Session closed', type: 'success' });
      execute();
    } catch (err) {
      toast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  if (!data?.sessions?.length) {
    return <EmptyState icon={MessageSquare} title="No sessions" />;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Sessions</h1>
      </header>
      <Card padding="none">
        <div className={styles.table} style={{ '--col-template': '2fr 1fr 1fr 1fr 1fr 80px' }}>
          <div className={styles.thead}>
            <div className={styles.th}>Session</div>
            <div className={styles.th}>Status</div>
            <div className={styles.th}>Cost</div>
            <div className={styles.th}>Tokens</div>
            <div className={styles.th}>Started</div>
            <div className={styles.th}></div>
          </div>
          <div className={styles.tbody}>
            {data.sessions.map((s) => (
              <div key={s.id} className={styles.tr}>
                <div className={styles.td}>
                  <div className={styles.name} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {s.id.split('-')[0]}…
                  </div>
                </div>
                <div className={styles.td}>
                  <Badge variant={sessionBadge(s.status)}>{s.status}</Badge>
                </div>
                <div className={styles.td}>{formatCostShort(s.totalCost)}</div>
                <div className={styles.td}>{formatTokens(s.totalTokens ?? (s.totalPromptTokens + s.totalCompletionTokens))}</div>
                <div className={styles.td} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(s.startedAt)}
                </div>
                <div className={styles.td}>
                  {s.status === 'active' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleClose(s.id)}
                      title="Close session"
                    >
                      <XCircle size={12} aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
