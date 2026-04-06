import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE,
});

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'x-auth-token': token } : {};
}
