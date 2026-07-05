import React from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading = false, danger = true }) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={400}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
