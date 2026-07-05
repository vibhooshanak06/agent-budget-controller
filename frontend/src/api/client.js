import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap { status, data } envelope
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred';
    const enhanced = new Error(message);
    enhanced.status = err.response?.status;
    enhanced.code = err.response?.data?.code;
    enhanced.originalError = err;
    return Promise.reject(enhanced);
  },
);

export default client;
