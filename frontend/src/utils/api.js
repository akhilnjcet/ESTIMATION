import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const programId = localStorage.getItem('programId');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (programId) {
    config.headers['x-program-id'] = programId;
  }
  return config;
});

export default api;
