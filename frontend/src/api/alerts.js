import client from './client.js';

export const listAlerts = (params = {}) =>
  client.get('/alerts', { params }).then((r) => r.data.data);

export const acknowledgeAlert = (id) =>
  client.patch(`/alerts/${id}/acknowledge`).then((r) => r.data.data);
