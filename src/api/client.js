import axios from 'axios';
import { getToken } from '../context/AuthContext';

const client = axios.create({
  baseURL: 'http://localhost:4000',
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      window.location = '/signin';
    }
    return Promise.reject(err);
  }
);

export default client;
