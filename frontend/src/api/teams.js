import client from './client.js';

export const listTeams = (params = {}) =>
  client.get('/teams', { params }).then((r) => r.data.data);

export const getTeam = (id) =>
  client.get(`/teams/${id}`).then((r) => r.data.data);

export const createTeam = (body) =>
  client.post('/teams', body).then((r) => r.data.data);

export const updateTeam = (id, body) =>
  client.patch(`/teams/${id}`, body).then((r) => r.data.data);

export const deleteTeam = (id) =>
  client.delete(`/teams/${id}`).then((r) => r.data);
