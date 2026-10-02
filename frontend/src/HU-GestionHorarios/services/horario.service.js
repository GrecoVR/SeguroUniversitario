import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listarHorarios = (params) =>
  api.get('/horarios', { params }).then((r) => r.data);

export const crearHorario = (datos) =>
  api.post('/horarios', datos).then((r) => r.data);

export const actualizarHorario = (id, datos) =>
  api.put(`/horarios/${id}`, datos).then((r) => r.data);

export const eliminarHorario = (id) =>
  api.delete(`/horarios/${id}`).then((r) => r.data);
