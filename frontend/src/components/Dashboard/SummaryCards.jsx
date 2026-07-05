import React from 'react';
import { DollarSign, Zap, Ban, Repeat2, AlertTriangle } from 'lucide-react';
import { formatCostShort, formatTokens } from '../../utils/format.js';
import styles from './SummaryCards.module.css';

export default function SummaryCards({ summary = {} }) {
  const items = [
    {
      label: 'Total Spend',
      value: formatCostShort(summary.totalCost),
      sub: `of ${formatCostShort(summary.totalBudget)} budget (${summary.utilization ?? 0}%)`,
      icon: DollarSign,
      color: summary.utilization >= 80 ? 'var(--danger)' : 'var(--success)',
    },
    {
      label: 'Total Requests',
      value: (summary.totalRequests ?? 0).toLocaleString(),
      sub: `${(summary.blockedRequests ?? 0).toLocaleString()} blocked`,
      icon: Zap,
      color: 'var(--accent)',
    },
    {
      label: 'Blocked Requests',
      value: (summary.blockedRequests ?? 0).toLocaleString(),
      sub: 'budget exhaustion',
      icon: Ban,
      color: 'var(--danger)',
    },
    {
      label: 'Model Substitutions',
      value: (summary.modelSubstitutions ?? 0).toLocaleString(),
      sub: 'budget-driven',
      icon: Repeat2,
      color: 'var(--warning)',
    },
    {
      label: 'Runaway Agents',
      value: (summary.runawayAgents ?? 0).toLocaleString(),
      sub: 'unacknowledged',
      icon: AlertTriangle,
      color: summary.runawayAgents > 0 ? 'var(--danger)' : 'var(--text-muted)',
    },
  ];

  return (
    <div className={styles.grid}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={styles.card}>
            <div className={styles.row}>
              <span className={styles.label}>{item.label}</span>
              <Icon size={16} style={{ color: item.color }} aria-hidden="true" />
            </div>
            <div className={styles.value} style={{ color: item.color }}>
              {item.value}
            </div>
            <div className={styles.sub}>{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
