import client from './client.js';

export const sendChat = (body) =>
  client.post('/chat', body).then((r) => r.data.data);
