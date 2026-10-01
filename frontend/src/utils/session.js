export const getRol = () => {
  try { return JSON.parse(localStorage.getItem("usuario"))?.rol || null; }
  catch { return null; }
};