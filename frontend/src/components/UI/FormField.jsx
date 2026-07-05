import React from 'react';
import styles from './FormField.module.css';

export default function FormField({ label, error, hint, required, children }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.req} aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className={styles.hint}>{hint}</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`${styles.input} ${className}`} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`${styles.input} ${styles.select} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${styles.input} ${styles.textarea} ${className}`} {...props} />;
}
