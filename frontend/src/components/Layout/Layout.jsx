import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import ToastContainer from '../UI/ToastContainer.jsx';
import { ToastContext } from '../../context/ToastContext.js';
import { useToast } from '../../hooks/useToast.js';
import styles from './Layout.module.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className={`${styles.shell} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
        <div className={styles.main}>
          <TopBar />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
