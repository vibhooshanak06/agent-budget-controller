import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCostShort, formatTokens } from '../../utils/format.js';
import EmptyState from '../UI/EmptyState.jsx';
import { Repeat2 } from 'lucide-react';
import styles from './ModelBreakdown.module.css';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttModel}>{d.model}</div>
      <div>{formatCostShort(d.totalCost)}</div>
      <div>{formatTokens(d.totalTokens)} tokens</div>
      <div>{d.requests} requests</div>
    </div>
  );
};

export default function ModelBreakdown({ data = [] }) {
  if (!data.length) {
    return <EmptyState icon={Repeat2} title="No model data yet" />;
  }

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis
            dataKey="model"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="totalCost" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
