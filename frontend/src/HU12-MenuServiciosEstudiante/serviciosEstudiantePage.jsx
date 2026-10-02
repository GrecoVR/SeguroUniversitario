import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FichasAtencionGeneralPage, ID_ESTUDIANTE } from '../HU13-GestionarListaDeFichasMedicas/FichasAtencionGeneralPage';
import { FormularioFichaPage } from '../HU14-AgendarFichaGeneral/FormularioFichaPage';
import { CambiarContrasena } from '../HU24-CambiarContrasena/CambiarContrasena';
import './styles/servicios.css';

const paginasEstudiante = ['SERVICIOS', 'FICHAS', 'NUEVA_FICHA', 'EDITAR_FICHA', 'CAMBIAR_CONTRASENA'];

export const ServicioEstudiantePage = ({ onLogout }) => {
  const [pagina, setPagina] = useState('SERVICIOS');
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);

  const navegar = (destino, ficha = null) => {
    if (!paginasEstudiante.includes(destino)) return;

    setFichaSeleccionada(destino === 'EDITAR_FICHA' ? ficha : null);
    setPagina(destino);
  };

  const volverAlMenu = () => setPagina('SERVICIOS');

  if (pagina === 'FICHAS') {
    return <FichasAtencionGeneralPage onNavigate={navegar} onLogout={onLogout} />;
  }

  if (pagina === 'NUEVA_FICHA' || pagina === 'EDITAR_FICHA') {
    return (
      <FormularioFichaPage
        idEstudiante={ID_ESTUDIANTE}
        ficha={fichaSeleccionada}
        onNavigate={navegar}
      />
    );
  }

  if (pagina === 'CAMBIAR_CONTRASENA') {
    return (
      <div className="page-container">
        <Navbar activeTab="Servicios" onNavigate={navegar} onLogout={onLogout} />
        <main className="main-content">
          <CambiarContrasena onBack={volverAlMenu} onSuccess={volverAlMenu} />
        </main>
      </div>
    );
  }

  const servicios = [
    { label: 'Ficha Atención General', key: 'FICHAS' },
    { label: 'Ver Recetas', key: 'RECETAS' },
    { label: 'Ver Laboratorios', key: 'LABORATORIOS' },
    { label: 'Ver Historial Médico', key: 'HISTORIAL_MEDICO' },
    { label: 'Cambiar contraseña', key: 'CAMBIAR_CONTRASENA' },
  ];

  const handleServiceClick = (key) => {
    navegar(key);
  };

  return (
    <div className="page-container">
      <Navbar
        activeTab="Servicios"
        onNavigate={navegar}
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

export default ServicioEstudiantePage;