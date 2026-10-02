import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ServicioEstudiantePage } from "./HU12-MenuServiciosEstudiante/serviciosEstudiantePage";
import { ServicioMedicoPage } from "./HU2-MenuServiciosMedico/serviciosMedicoPage";
import { Login } from "./HU1-Login/components/Login";
import axios from "axios";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verifica si ya existe una sesión activa en el navegador al recargar la página
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  // Función que el componente Login ejecutará cuando las credenciales sean correctas
  const handleLoginSuccess = (datosUsuario) => {
    setUsuario(datosUsuario);
  };

  // Función para cerrar sesión y devolver al usuario a la pantalla de inicio
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  // Si no hay sesión activa, renderiza la pantalla de Login
  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si hay sesión, dirige al usuario según el rol que devolvió la base de datos
  switch (usuario.rol) {
    case "ESTUDIANTE":
      return <ServicioEstudiantePage onLogout={handleLogout} />;
    case "MEDICO":
      return <ServicioMedicoPage onLogout={handleLogout} />;
    case "ADMINISTRADOR":
      return (
        <div style={{ padding: "2rem" }}>
          <h1>Interfaz del Administrador</h1>
          <button onClick={handleLogout} style={{ padding: "0.5rem 1rem" }}>
            Cerrar Sesión
          </button>
        </div>
      );
    default:
      return (
        <div style={{ padding: "2rem" }}>
          <h1>Rol no reconocido</h1>
          <button onClick={handleLogout}>Volver al Inicio</button>
        </div>
      );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
