import client from './client.js';

export const getDashboard = (params = {}) =>
  client.get('/dashboard', { params }).then((r) => r.data.data);
