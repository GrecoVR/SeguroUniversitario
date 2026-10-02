const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || 'No se pudo completar la operación');
  }

  return data;
};

export const obtenerFichas = (idEstudiante) =>
  request(`/fichas?id_estudiante=${encodeURIComponent(idEstudiante)}`);

export const obtenerHorariosDisponibles = (idDoctor) =>
  request(`/fichas/horarios-disponibles${idDoctor ? `?id_doctor=${encodeURIComponent(idDoctor)}` : ''}`);

export const crearFicha = (datos) =>
  request('/fichas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });

export const actualizarFicha = (id, datos) =>
  request(`/fichas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });

export const eliminarFicha = (id) =>
  request(`/fichas/${id}`, { method: 'DELETE' });