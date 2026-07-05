import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.code}>404</div>
      <div className={styles.message}>Page not found</div>
      <Link to="/dashboard" className={styles.link}>Back to dashboard</Link>
    </div>
  );
}
