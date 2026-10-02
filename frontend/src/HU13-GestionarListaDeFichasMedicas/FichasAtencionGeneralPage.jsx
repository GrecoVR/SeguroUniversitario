import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { eliminarFicha, obtenerFichas } from './services/fichas';
import './styles/servicios.css';

const mostrarHora = (hora) => hora?.slice(0, 5) || '';
export const ID_ESTUDIANTE = 7;

export const FichasAtencionGeneralPage = ({ onNavigate, onLogout }) => {
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {
    if (!ID_ESTUDIANTE) {
      setFichas([]);
      setCargando(false);
      return;
    }

    let vigente = true;
    setCargando(true);
    setError('');

    obtenerFichas(ID_ESTUDIANTE)
      .then((datos) => {
        if (vigente) setFichas(datos);
      })
      .catch((solicitudError) => {
        if (vigente) setError(solicitudError.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [actualizacion]);

  const handleNuevoClick = () => {
    if (!Number.isInteger(ID_ESTUDIANTE) || ID_ESTUDIANTE < 1) {
      setError('Configura un ID de estudiante válido en la constante ID_ESTUDIANTE.');
      return;
    }

    onNavigate('NUEVA_FICHA');
  };

  const handleEditar = (ficha) => {
    onNavigate('EDITAR_FICHA', ficha);
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Está seguro de cancelar esta ficha?')) return;

    try {
      await eliminarFicha(id);
      setActualizacion((valor) => valor + 1);
    } catch (solicitudError) {
      setError(solicitudError.message);
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
        {/* ENCABEZADO CON TÍTULO Y BOTÓN NUEVO */}
        <header className="header-with-action">
          <h1 className="title-blue">FICHAS ATENCIÓN GENERAL</h1>
          <button className="btn-primary" onClick={handleNuevoClick}>
            Nuevo
          </button>
        </header>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {/* TABLA DE FICHAS */}
        <div className="table-responsive">
          <table className="fichas-table">
            <thead>
              <tr>
                <th>NRO</th>
                <th>Doctor</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th className="text-center">Editar</th>
                <th className="text-center">Cancelar</th>
              </tr>
            </thead>
            <tbody>
              {fichas.map((ficha) => (
                <tr key={ficha.id}>
                  <td>{ficha.nro}</td>
                  <td>Dr. {ficha.nombresDoctor} {ficha.apellidoDoctor}</td>
                  <td>{ficha.fecha}</td>
                  <td>{mostrarHora(ficha.hora)} - {mostrarHora(ficha.horaFin)}</td>
                  <td className="text-center">
                    <button
                      className="btn-icon"
                      title="Editar Ficha"
                      disabled={!ficha.activo}
                      onClick={() => handleEditar(ficha)}
                    >
                      📝
                    </button>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn-icon"
                      title="Cancelar Ficha"
                      disabled={!ficha.activo}
                      onClick={() => handleCancelar(ficha.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {!cargando && fichas.length === 0 && (
                <tr>
                  <td colSpan="6" className="ficha-empty-message">
                    'No hay fichas para este estudiante.'
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {cargando && <p className="ficha-empty-message">Cargando fichas...</p>}

        {/* BOTÓN DE RETORNO ATRÁS */}
        <div className="actions-footer">
          <button className="btn-back" onClick={() => onNavigate('SERVICIOS')}>
            Atrás
          </button>
        </div>
      </main>
    </div>
  );
};
