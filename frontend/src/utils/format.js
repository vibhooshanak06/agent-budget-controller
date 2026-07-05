import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** Format a dollar amount */
export function formatCost(value, decimals = 6) {
  const n = parseFloat(value) || 0;
  if (n === 0) return '$0.00';
  if (n < 0.000001) return '<$0.000001';
  return `$${n.toFixed(decimals)}`;
}

/** Format a dollar amount short (2 decimal places) */
export function formatCostShort(value) {
  const n = parseFloat(value) || 0;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return formatCost(n);
}

/** Format token count with commas */
export function formatTokens(value) {
  const n = parseInt(value, 10) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format a date string to a readable format */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

/** Format a date as relative time (e.g. "2 hours ago") */
export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

/** Format utilization % */
export function formatUtilization(used, limit) {
  const u = parseFloat(used) || 0;
  const l = parseFloat(limit) || 0;
  if (l <= 0) return '0%';
  return `${Math.round((u / l) * 100)}%`;
}

/** Get utilization ratio 0–1 */
export function utilizationRatio(used, limit) {
  const u = parseFloat(used) || 0;
  const l = parseFloat(limit) || 0;
  if (l <= 0) return 0;
  return Math.min(u / l, 1);
}

/** Get CSS color variable based on utilization */
export function utilizationColor(ratio) {
  if (ratio >= 1.0) return 'var(--danger)';
  if (ratio >= 0.8) return 'var(--warning)';
  return 'var(--success)';
}

/** Format latency */
export function formatLatency(ms) {
  if (!ms) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Status badge color */
export function statusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':   return 'var(--success)';
    case 'closed':   return 'var(--text-secondary)';
    case 'terminated':
    case 'blocked':  return 'var(--danger)';
    case 'paused':   return 'var(--warning)';
    default:         return 'var(--text-muted)';
  }
}

/** Alert severity color */
export function severityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'var(--danger)';
    case 'warning':  return 'var(--warning)';
    case 'info':     return 'var(--info)';
    default:         return 'var(--text-secondary)';
  }
}
