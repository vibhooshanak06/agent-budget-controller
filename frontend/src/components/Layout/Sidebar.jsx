import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  Bell,
  FileText,
  Repeat2,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teams',               icon: Users,           label: 'Teams' },
  { to: '/agents',              icon: Bot,             label: 'Agents' },
  { to: '/sessions',            icon: MessageSquare,   label: 'Sessions' },
  { to: '/alerts',              icon: Bell,            label: 'Alerts' },
  { to: '/usage-logs',          icon: FileText,        label: 'Usage Logs' },
  { to: '/model-substitutions', icon: Repeat2,         label: 'Model Subs' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} aria-label="Main navigation">
      {/* Brand */}
      <div className={styles.brand}>
        <Activity size={20} className={styles.brandIcon} aria-hidden="true" />
        {!collapsed && <span className={styles.brandName}>Budget Controller</span>}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {!collapsed && <span className={styles.navLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight size={16} aria-hidden="true" />
          : <ChevronLeft  size={16} aria-hidden="true" />
        }
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
