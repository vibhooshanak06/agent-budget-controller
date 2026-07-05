import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';
import styles from './ErrorState.module.css';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className={styles.wrapper} role="alert">
      <AlertCircle size={32} color="var(--danger)" aria-hidden="true" />
      <p className={styles.message}>{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
