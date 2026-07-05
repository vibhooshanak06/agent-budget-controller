import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Simple toast notification state manager.
 * Returns { toasts, toast } where toast({ title, message, type }) adds a toast.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return { toasts, toast, dismiss };
}
