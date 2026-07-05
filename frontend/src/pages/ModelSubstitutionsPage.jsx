import React from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { listModelSubstitutions } from '../api/modelSubstitutions.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import { Repeat2, ArrowRight } from 'lucide-react';
import { formatDate } from '../utils/format.js';
import styles from './TablePage.module.css';

export default function ModelSubstitutionsPage() {
  const { data, loading, error, execute } = useAsync(listModelSubstitutions, []);

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  if (!data?.substitutions?.length) {
    return <EmptyState icon={Repeat2} title="No model substitutions" />;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Model Substitutions</h1>
      </header>
      <Card padding="none">
        <div className={styles.table} style={{ '--col-template': '2fr 3fr 2fr' }}>
          <div className={styles.thead}>
            <div className={styles.th}>Time</div>
            <div className={styles.th}>Substitution</div>
            <div className={styles.th}>Reason</div>
          </div>
          <div className={styles.tbody}>
            {data.substitutions.map((sub) => (
              <div key={sub.id} className={styles.tr}>
                <div className={styles.td} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {formatDate(sub.createdAt)}
                </div>
                <div className={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {sub.requestedModel}
                    </code>
                    <ArrowRight size={12} color="var(--text-muted)" aria-hidden="true" />
                    <code style={{ fontSize: 11, fontWeight: 600 }}>
                      {sub.resolvedModel}
                    </code>
                  </div>
                </div>
                <div className={styles.td} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {sub.reason || 'Budget threshold'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
