import React from 'react';
import { X, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './ToastContainer.module.css';

const ICONS = {
  info:    Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error:   AlertCircle,
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className={styles.container} role="region" aria-label="Notifications">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="alert">
            <Icon size={16} className={styles.icon} aria-hidden="true" />
            <div className={styles.body}>
              {t.title && <div className={styles.title}>{t.title}</div>}
              {t.message && <div className={styles.message}>{t.message}</div>}
            </div>
            <button
              className={styles.close}
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
