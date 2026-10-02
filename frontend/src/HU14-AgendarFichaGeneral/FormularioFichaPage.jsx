import React, { useEffect, useState } from 'react';
import { Navbar } from '../HU13-GestionarListaDeFichasMedicas/components/Navbar';
import {
  actualizarFicha,
  crearFicha,
  obtenerHorariosDisponibles,
} from '../HU13-GestionarListaDeFichasMedicas/services/fichas';
import '../HU13-GestionarListaDeFichasMedicas/styles/servicios.css';
import './styles/solicitarFicha.css';

const mostrarHora = (hora) => hora?.slice(0, 5) || '';

export const FormularioFichaPage = ({ idEstudiante, ficha, onNavigate }) => {
  const [horarios, setHorarios] = useState([]);
  const [idDoctor, setIdDoctor] = useState(ficha ? String(ficha.idDoctor) : '');
  const [fecha, setFecha] = useState(ficha?.fecha || '');
  const [idHorario, setIdHorario] = useState(ficha?.idHorario?.toString() || '');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;

    obtenerHorariosDisponibles(ficha?.idDoctor)
      .then((datos) => {
        if (vigente) setHorarios(datos);
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
  }, [ficha?.idDoctor]);

  const horariosFormulario = ficha && !horarios.some((item) => String(item.idHorario) === String(ficha.idHorario))
    ? [ficha, ...horarios]
    : horarios;
  const doctores = [...new Map(horariosFormulario.map((horario) => [
    String(horario.idDoctor), {
      id: String(horario.idDoctor),
      nombres: horario.nombresDoctor,
      apellido: horario.apellidoDoctor,
    },
  ])).values()];
  const horariosDoctor = horariosFormulario.filter((horario) => String(horario.idDoctor) === idDoctor);
  const fechas = [...new Set(horariosDoctor.map((horario) => horario.fecha))];
  const horariosFecha = horariosDoctor.filter((horario) => horario.fecha === fecha);

  const guardarFicha = async (event) => {
    event.preventDefault();
    setError('');

    if (!Number.isInteger(Number(idEstudiante)) || Number(idEstudiante) < 1) {
      setError('Ingresa un ID de estudiante válido en la lista de fichas.');
      return;
    }

    if (!idDoctor || !fecha) {
      setError('Selecciona un doctor y una fecha disponibles.');
      return;
    }

    if (!idHorario) {
      setError('Selecciona una hora disponible.');
      return;
    }

    setGuardando(true);

    try {
      if (ficha) {
        await actualizarFicha(ficha.id, { id_horario: Number(idHorario) });
      } else {
        await crearFicha({
          id_estudiante: Number(idEstudiante),
          id_horario: Number(idHorario),
        });
      }

      onNavigate('FICHAS');
    } catch (solicitudError) {
      setError(solicitudError.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar activeTab="Servicios" onNavigate={onNavigate} />
      <main className="main-content">
        <header className="header-with-action">
          <h1 className="title-blue ficha-form-title">
            {ficha ? 'EDITAR FICHA' : 'SOLICITAR FICHA GENERAL'}
          </h1>
        </header>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form className="ficha-form" onSubmit={guardarFicha}>
          {ficha ? (
            <label className="ficha-form-field">
              <span>Médico:</span>
              <input value={`Dr. ${ficha.nombresDoctor} ${ficha.apellidoDoctor}`} readOnly />
            </label>
          ) : (
            <label className="ficha-form-field">
              <span>Médico:</span>
              <select
                value={idDoctor}
                onChange={(event) => {
                  setIdDoctor(event.target.value);
                  setFecha('');
                  setIdHorario('');
                }}
                disabled={cargando || doctores.length === 0}
                required
              >
                <option value="">
                  {cargando
                    ? 'Cargando doctores...'
                    : doctores.length > 0
                      ? 'Seleccione doctor'
                      : 'No hay doctores con horarios disponibles'}
                </option>
                {doctores.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.nombres} {doctor.apellido}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="ficha-form-field">
            <span>Fecha:</span>
            <select
              value={fecha}
              onChange={(event) => {
                setFecha(event.target.value);
                setIdHorario('');
              }}
              disabled={cargando || !idDoctor || fechas.length === 0}
              required
            >
              <option value="">
                {cargando ? 'Cargando fechas...' : 'Seleccione fecha'}
              </option>
              {fechas.map((fechaDisponible) => (
                <option key={fechaDisponible} value={fechaDisponible}>
                  {fechaDisponible}
                </option>
              ))}
            </select>
          </label>

          <label className="ficha-form-field">
            <span>Horarios disponibles:</span>
            <select
              value={idHorario}
              onChange={(event) => setIdHorario(event.target.value)}
              disabled={cargando || !fecha || horariosFecha.length === 0}
              required
            >
              <option value="">{cargando ? 'Cargando horas...' : 'Seleccione hora'}</option>
              {horariosFecha.map((horario) => (
                <option key={horario.idHorario} value={horario.idHorario}>
                  {mostrarHora(horario.hora)} - {mostrarHora(horario.horaFin)}
                </option>
              ))}
            </select>
          </label>

          {!cargando && horariosFormulario.length === 0 && (
            <p className="ficha-empty-message">
              No hay horarios futuros disponibles. Registra un usuario con rol MEDICO y agrega sus fechas y horarios libres.
            </p>
          )}

          <div className="ficha-form-actions">
            <button className="btn-back" type="button" onClick={() => onNavigate('FICHAS')}>
              Atrás
            </button>
            <button
              className="btn-primary"
              type="submit"
              disabled={guardando || cargando || horariosFormulario.length === 0}
            >
              {guardando ? 'Guardando...' : ficha ? 'Guardar cambios' : 'Agendar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
