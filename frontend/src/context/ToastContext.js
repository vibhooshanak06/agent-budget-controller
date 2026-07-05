import { createContext, useContext } from 'react';

export const ToastContext = createContext({ toast: () => {} });

export function useToastContext() {
  return useContext(ToastContext);
}
