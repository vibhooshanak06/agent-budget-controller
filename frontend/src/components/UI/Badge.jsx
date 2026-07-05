import React from 'react';
import styles from './Badge.module.css';

/**
 * Small status/label chip.
 * @param {string} variant - 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
