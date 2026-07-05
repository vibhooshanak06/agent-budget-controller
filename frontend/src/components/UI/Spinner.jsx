import React from 'react';
import styles from './Spinner.module.css';

export default function Spinner({ size = 24, label = 'Loading...' }) {
  return (
    <div className={styles.wrapper} role="status" aria-label={label}>
      <div
        className={styles.spinner}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
