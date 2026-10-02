import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CambiarContrasena } from '../HU24-CambiarContrasena/CambiarContrasena';
import './styles/servicios.css';

export const ServicioEstudiantePage = ({ onLogout, onNavigate }) => {
  // Estado local para controlar si se muestra el menú o la vista de cambiar contraseña
  const [vistaActual, setVistaActual] = useState('MENU');

  const servicios = [
    { label: 'Ficha Atención General', key: 'FICHA_ATENCION_GENERAL' },
    { label: 'Ver Recetas', key: 'RECETAS' },
    { label: 'Ver Laboratorios', key: 'LABORATORIOS' },
    { label: 'Ver Historial Médico', key: 'HISTORIAL_MEDICO' },
    { label: 'Cambiar contraseña', key: 'CAMBIAR_CONTRASENA' },
  ];

  const handleServiceClick = (key) => {
    if (key === 'CAMBIAR_CONTRASENA') {
      setVistaActual('CAMBIAR_CONTRASENA');
    } else if (onNavigate) {
      onNavigate(key);
    }
  };

  const handleVolverAlMenu = () => {
    setVistaActual('MENU');
  };

  return (
    <div className="page-container">
      <Navbar
        activeTab="Servicios"
        onNavigate={(key) => {
          setVistaActual('MENU');
          if (onNavigate) onNavigate(key);
        }}
        onLogout={onLogout}
      />

      <main className="main-content">
        {vistaActual === 'CAMBIAR_CONTRASENA' ? (
          <CambiarContrasena
            onBack={handleVolverAlMenu}
            onSuccess={handleVolverAlMenu}
          />
        ) : (
          <>
            <header className="services-header">
              <h1 className="title-blue">SERVICIOS</h1>
            </header>

            <section className="services-menu">
              {servicios.map((servicio) => (
                <button
                  key={servicio.key}
                  className="btn-service"
                  onClick={() => handleServiceClick(servicio.key)}
                >
                  {servicio.label}
                </button>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ServicioEstudiantePage;