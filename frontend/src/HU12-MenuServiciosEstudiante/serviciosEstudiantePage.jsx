import React from 'react';
import {Navbar} from './components/Navbar';
import './styles/servicios.css';

export const ServicioEstudiantePage = ({ onLogout, onNavigate }) => {
  const servicios = [
    { label: 'Ficha Atención General', key: 'FICHA_ATENCION_GENERAL' },
    { label: 'Ver Recetas', key: 'RECETAS' },
    { label: 'Ver Laboratorios', key: 'LABORATORIOS' },
    { label: 'Ver Historial Médico', key: 'HISTORIAL_MEDICO' },
    { label: 'Cambiar contraseña', key: 'CAMBIAR_CONTRASENA' },
  ];

  const handleServiceClick = (key) => {
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <div className="page-container">
      <Navbar
        activeTab="Servicios"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="main-content">
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
      </main>
    </div>
  );
};

