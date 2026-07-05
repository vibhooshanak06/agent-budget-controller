import React from 'react';
import { utilizationRatio, utilizationColor } from '../../utils/format.js';
import styles from './ProgressBar.module.css';

export default function ProgressBar({ used, limit, height = 8, showLabel = false }) {
  const ratio = utilizationRatio(used, limit);
  const pct = Math.round(ratio * 100);
  const color = utilizationColor(ratio);

  return (
    <div className={styles.container}>
      <div className={styles.track} style={{ height: `${height}px` }}>
        <div
          className={styles.fill}
          style={{ width: `${pct}%`, background: color }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      {showLabel && <span className={styles.label}>{pct}%</span>}
    </div>
  );
}
