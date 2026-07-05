import React from 'react';
import ProgressBar from '../UI/ProgressBar.jsx';
import { formatCostShort } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { Users } from 'lucide-react';
import styles from './TeamList.module.css';

export default function TeamList({ teams = [] }) {
  if (!teams.length) {
    return <EmptyState icon={Users} title="No teams yet" description="Create a team to get started" />;
  }

  return (
    <div className={styles.list}>
      {teams.map((team) => (
        <div key={team.id} className={styles.item}>
          <div className={styles.meta}>
            <div className={styles.name}>{team.name}</div>
            <div className={styles.agents}>{team.agentCount} agents</div>
          </div>
          <ProgressBar used={team.budgetUsed} limit={team.budgetLimit} height={6} />
          <div className={styles.budget}>
            {formatCostShort(team.budgetUsed)} / {formatCostShort(team.budgetLimit)}
          </div>
        </div>
      ))}
    </div>
  );
}
