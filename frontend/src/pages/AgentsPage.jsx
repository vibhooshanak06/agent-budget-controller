import React, { useContext } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { listAgents, resumeAgent } from '../api/agents.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import ProgressBar from '../components/UI/ProgressBar.jsx';
import Badge from '../components/UI/Badge.jsx';
import Button from '../components/UI/Button.jsx';
import { Bot, Play } from 'lucide-react';
import { formatCostShort, formatDate } from '../utils/format.js';
import { ToastContext } from '../context/ToastContext.js';
import styles from './TablePage.module.css';

function agentBadgeVariant(status) {
  if (status === 'active') return 'success';
  if (status === 'blocked') return 'danger';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

export default function AgentsPage() {
  const { toast } = useContext(ToastContext);
  const { data, loading, error, execute } = useAsync(listAgents, []);

  const handleResume = async (id, name) => {
    try {
      await resumeAgent(id);
      toast({ title: 'Agent resumed', message: `"${name}" is now active.`, type: 'success' });
      execute();
    } catch (err) {
      toast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  if (!data?.agents?.length) {
    return <EmptyState icon={Bot} title="No agents" description="Create agents within a team" />;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Agents</h1>
      </header>
      <Card padding="none">
        <div className={styles.table} style={{ '--col-template': '2fr 2fr 1fr 1fr 80px' }}>
          <div className={styles.thead}>
            <div className={styles.th}>Name</div>
            <div className={styles.th}>Budget</div>
            <div className={styles.th}>Model</div>
            <div className={styles.th}>Status</div>
            <div className={styles.th}></div>
          </div>
          <div className={styles.tbody}>
            {data.agents.map((a) => (
              <div key={a.id} className={styles.tr}>
                <div className={styles.td}>
                  <div className={styles.name}>{a.name}</div>
                  <div className={styles.slug}>{a.slug}</div>
                </div>
                <div className={styles.td}>
                  <div className={styles.budget}>
                    {formatCostShort(a.budgetUsed)} / {formatCostShort(a.budgetLimit)}
                  </div>
                  <ProgressBar used={a.budgetUsed} limit={a.budgetLimit} height={4} />
                </div>
                <div className={styles.td}>
                  <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {a.modelPreference || '—'}
                  </code>
                </div>
                <div className={styles.td}>
                  <Badge variant={agentBadgeVariant(a.status)}>{a.status}</Badge>
                </div>
                <div className={styles.td}>
                  {a.status === 'blocked' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResume(a.id, a.name)}
                      title="Resume this agent"
                    >
                      <Play size={12} aria-hidden="true" />
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
