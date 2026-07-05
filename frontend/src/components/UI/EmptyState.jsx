import React from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={styles.wrapper}>
      {Icon && <Icon size={32} className={styles.icon} aria-hidden="true" />}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
