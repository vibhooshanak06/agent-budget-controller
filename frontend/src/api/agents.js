import client from './client.js';

export const listAgents = (params = {}) =>
  client.get('/agents', { params }).then((r) => r.data.data);

export const getAgent = (id) =>
  client.get(`/agents/${id}`).then((r) => r.data.data);

export const createAgent = (body) =>
  client.post('/agents', body).then((r) => r.data.data);

export const updateAgent = (id, body) =>
  client.patch(`/agents/${id}`, body).then((r) => r.data.data);

export const deleteAgent = (id) =>
  client.delete(`/agents/${id}`).then((r) => r.data);

export const resumeAgent = (id) =>
  client.post(`/agents/${id}/resume`).then((r) => r.data);
