import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import AgentsPage from './pages/AgentsPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import UsageLogsPage from './pages/UsageLogsPage.jsx';
import ModelSubstitutionsPage from './pages/ModelSubstitutionsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="usage-logs" element={<UsageLogsPage />} />
          <Route path="model-substitutions" element={<ModelSubstitutionsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
