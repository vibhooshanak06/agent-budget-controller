import React from 'react';
import { formatCostShort, formatTokens } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { Bot } from 'lucide-react';
import styles from './TopAgents.module.css';

export default function TopAgents({ agents = [] }) {
  if (!agents.length) {
    return <EmptyState icon={Bot} title="No usage data" />;
  }

  return (
    <div className={styles.list}>
      {agents.map((a, i) => (
        <div key={a.agentId} className={styles.row}>
          <span className={styles.rank}>#{i + 1}</span>
          <div className={styles.info}>
            <div className={styles.name}>{a.agentName}</div>
            <div className={styles.tokens}>{formatTokens(a.totalTokens)} tokens · {a.requests} requests</div>
          </div>
          <span className={styles.cost}>{formatCostShort(a.totalCost)}</span>
        </div>
      ))}
    </div>
  );
}
