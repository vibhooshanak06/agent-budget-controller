import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatCostShort } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { Clock } from 'lucide-react';
import styles from './HourlyUsageChart.module.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const hr = new Date(d.hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={styles.tooltip}>
      <div className={styles.hour}>{hr}</div>
      <div>Cost: {formatCostShort(d.totalCost)}</div>
      <div>Requests: {d.requests}</div>
    </div>
  );
};

export default function HourlyUsageChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState icon={Clock} title="No hourly data" />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="hour"
          tickFormatter={(v) => new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCostShort(v)}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="totalCost"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#costGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
