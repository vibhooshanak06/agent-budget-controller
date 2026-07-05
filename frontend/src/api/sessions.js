import client from './client.js';

export const listSessions = (params = {}) =>
  client.get('/sessions', { params }).then((r) => r.data.data);

export const getSession = (id) =>
  client.get(`/sessions/${id}`).then((r) => r.data.data);

export const createSession = (body) =>
  client.post('/sessions', body).then((r) => r.data.data);

export const closeSession = (id) =>
  client.patch(`/sessions/${id}/close`).then((r) => r.data.data);
