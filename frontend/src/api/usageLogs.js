import client from './client.js';

export const listUsageLogs = (params = {}) =>
  client.get('/usage-logs', { params }).then((r) => r.data.data);
