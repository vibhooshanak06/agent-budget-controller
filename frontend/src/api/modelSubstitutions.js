import client from './client.js';

export const listModelSubstitutions = (params = {}) =>
  client.get('/model-substitutions', { params }).then((r) => r.data.data);
