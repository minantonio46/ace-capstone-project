import api from './axiosInstance';

export async function login(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  localStorage.setItem('accessToken',  data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  localStorage.setItem('wardId',       data.data.wardId);
  localStorage.setItem('userId',       data.data.userId);
  return data.data;
}

export async function logout() {
  await api.post('/api/auth/logout');
  localStorage.clear();
  window.location.href = '/';
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken');
}