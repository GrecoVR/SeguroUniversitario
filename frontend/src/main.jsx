
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ServicioEstudiantePage } from './HU12-MenuServiciosEstudiante/serviciosEstudiantePage';
import { ServicioMedicoPage } from './HU2-MenuServiciosMedico/serviciosMedicoPage';

const ROL = 'MEDICO'; // Cambia este valor para probar diferentes roles: 'ESTUDIANTE', 'MEDICO', 'ADMINISTRADOR'

function App() {
  const mostrarInterfaz = () => {
    switch (ROL) {
      case 'ESTUDIANTE':
        return <ServicioEstudiantePage />;

      case 'MEDICO':
        return <ServicioMedicoPage/>;

      case 'ADMINISTRADOR':
        return <div>Interfaz del Administrador</div>;

      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <>
      {mostrarInterfaz()}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);