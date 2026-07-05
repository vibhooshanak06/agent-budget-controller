import React from 'react';
import styles from './Card.module.css';

export default function Card({ children, className = '', padding = 'md', ...props }) {
  return (
    <div className={`${styles.card} ${styles[`pad-${padding}`]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`${styles.title} ${className}`}>{children}</h2>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}
