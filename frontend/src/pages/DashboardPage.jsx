import React, { useEffect } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { getDashboard } from '../api/dashboard.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import Card, { CardHeader, CardTitle, CardBody } from '../components/UI/Card.jsx';
import SummaryCards from '../components/Dashboard/SummaryCards.jsx';
import TeamList from '../components/Dashboard/TeamList.jsx';
import TopAgents from '../components/Dashboard/TopAgents.jsx';
import RecentUsage from '../components/Dashboard/RecentUsage.jsx';
import RecentAlerts from '../components/Dashboard/RecentAlerts.jsx';
import ModelBreakdown from '../components/Dashboard/ModelBreakdown.jsx';
import DailyUsageChart from '../components/Dashboard/DailyUsageChart.jsx';
import HourlyUsageChart from '../components/Dashboard/HourlyUsageChart.jsx';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { data, loading, error, execute } = useAsync(getDashboard, []);

  // Auto-refresh on Socket.IO events
  useSocketEvent('usage_logged', execute);
  useSocketEvent('budget_warning', execute);
  useSocketEvent('budget_exceeded', execute);
  useSocketEvent('model_substituted', execute);

  if (loading) return <Spinner size={40} label="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </header>

      {/* Summary cards */}
      <SummaryCards summary={data.summary} />

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <Card padding="md" className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Daily Usage (30 days)</CardTitle>
          </CardHeader>
          <CardBody>
            <DailyUsageChart data={data.dailyUsage} />
          </CardBody>
        </Card>

        <Card padding="md" className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Hourly Usage (24h)</CardTitle>
          </CardHeader>
          <CardBody>
            <HourlyUsageChart data={data.hourlyUsage} />
          </CardBody>
        </Card>
      </div>

      {/* Model breakdown */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Model Breakdown</CardTitle>
        </CardHeader>
        <CardBody>
          <ModelBreakdown data={data.modelBreakdown} />
        </CardBody>
      </Card>

      {/* Top agents + recent usage */}
      <div className={styles.agentsRow}>
        <Card padding="md" className={styles.listCard}>
          <CardHeader>
            <CardTitle>Top Spending Agents</CardTitle>
          </CardHeader>
          <CardBody>
            <TopAgents agents={data.topAgents} />
          </CardBody>
        </Card>

        <Card padding="md" className={styles.listCard}>
          <CardHeader>
            <CardTitle>Recent Usage</CardTitle>
          </CardHeader>
          <CardBody>
            <RecentUsage logs={data.recentUsage} />
          </CardBody>
        </Card>
      </div>

      {/* Teams */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardBody>
          <TeamList teams={data.teams} />
        </CardBody>
      </Card>

      {/* Recent alerts */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardBody>
          <RecentAlerts alerts={data.recentAlerts} />
        </CardBody>
      </Card>
    </div>
  );
}
