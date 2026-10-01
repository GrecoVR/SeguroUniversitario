import { useCallback, useEffect, useMemo, useState } from 'react';
import HorarioForm from '../components/HorarioForm';
import {
  listarHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
} from '../services/horarios.service';

const mensajeDeError = (err, porDefecto) => err.response?.data?.mensaje || porDefecto;

const formatearFecha = (fecha) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function Horarios() {
  const [horarios, setHorarios] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  // null = formulario cerrado | { horario: null } = crear | { horario } = editar
  const [formulario, setFormulario] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await listarHorarios(filtroFecha ? { fecha: filtroFecha } : undefined);
      setHorarios(datos);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar los horarios. Intenta de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [filtroFecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porFecha = useMemo(() => {
    const grupos = {};
    horarios.forEach((h) => {
      (grupos[h.fecha] = grupos[h.fecha] || []).push(h);
    });
    return Object.entries(grupos);
  }, [horarios]);

  const abrirFormulario = (horario = null) => {
    setErrorForm('');
    setAviso('');
    setFormulario({ horario });
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setErrorForm('');
  };

  const guardar = async (datos) => {
    setEnviando(true);
    setErrorForm('');
    try {
      const editando = Boolean(formulario.horario);
      if (editando) {
        await actualizarHorario(formulario.horario.id_horario, datos);
      } else {
        await crearHorario(datos);
      }
      setFormulario(null);
      setAviso(editando ? 'Horario actualizado.' : 'Horario creado.');
      await cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar el horario. Intenta de nuevo.'));
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (horario) => {
    const rango = `${horario.hora_inicio} a ${horario.hora_fin}`;
    if (!window.confirm(`¿Eliminar el horario de ${rango} del ${horario.fecha}?`)) return;

    setAviso('');
    setError('');
    try {
      await eliminarHorario(horario.id_horario);
      setAviso('Horario eliminado.');
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el horario. Intenta de nuevo.'));
    }
  };

  return (
    <main style={estilos.pagina}>
      <header style={estilos.encabezado}>
        <h1 style={estilos.titulo}>Mis horarios de atención</h1>
        <button type="button" onClick={() => abrirFormulario()} style={estilos.primario}>
          Nuevo horario
        </button>
      </header>

      {formulario && (
        <section style={{ marginBottom: '1.5rem' }}>
          <HorarioForm
            key={formulario.horario?.id_horario || 'nuevo'}
            inicial={formulario.horario}
            onGuardar={guardar}
            onCancelar={cerrarFormulario}
            enviando={enviando}
            errorServidor={errorForm}
          />
        </section>
      )}

      <div style={estilos.filtro}>
        <label>
          Filtrar por fecha{' '}
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
        </label>
        {filtroFecha && (
          <button type="button" onClick={() => setFiltroFecha('')} style={estilos.enlace}>
            Quitar filtro
          </button>
        )}
      </div>

      {aviso && <p role="status" style={estilos.aviso}>{aviso}</p>}
      {error && <p role="alert" style={estilos.error}>{error}</p>}

      {cargando ? (
        <p>Cargando horarios...</p>
      ) : porFecha.length === 0 ? (
        <p>
          {filtroFecha
            ? 'No tienes horarios en esa fecha.'
            : 'Aún no tienes horarios. Crea el primero con "Nuevo horario".'}
        </p>
      ) : (
        porFecha.map(([fecha, items]) => (
          <section key={fecha} style={estilos.grupo}>
            <h2 style={estilos.fecha}>{formatearFecha(fecha)}</h2>
            <ul style={estilos.lista}>
              {items.map((h) => (
                <li key={h.id_horario} style={estilos.item}>
                  <span style={estilos.hora}>
                    {h.hora_inicio} a {h.hora_fin}
                  </span>
                  <span style={h.reservado ? estilos.reservado : estilos.libre}>
                    {h.reservado ? 'Reservado' : 'Disponible'}
                  </span>
                  <span style={estilos.acciones}>
                    <button
                      type="button"
                      onClick={() => abrirFormulario(h)}
                      disabled={h.reservado}
                      title={h.reservado ? 'Tiene una ficha reservada' : ''}
                      style={estilos.secundario}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(h)}
                      disabled={h.reservado}
                      title={h.reservado ? 'Tiene una ficha reservada' : ''}
                      style={estilos.peligro}
                    >
                      Eliminar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

const estilos = {
  pagina: { fontFamily: 'sans-serif', padding: '2rem', maxWidth: 760, margin: '0 auto' },
  encabezado: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  titulo: { margin: 0, fontSize: '1.5rem' },
  filtro: { display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' },
  grupo: { marginBottom: '1.5rem' },
  fecha: { fontSize: '1.05rem', textTransform: 'capitalize', margin: '0 0 0.5rem' },
  lista: { listStyle: 'none', margin: 0, padding: 0, border: '1px solid #c9d3dd', borderRadius: 8 },
  item: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem 1rem', borderBottom: '1px solid #e3e8ed' },
  hora: { flex: 1, fontWeight: 600 },
  libre: { color: '#1b6b3a', fontSize: '0.9rem' },
  reservado: { color: '#8a5a00', fontSize: '0.9rem' },
  acciones: { display: 'flex', gap: '0.5rem' },
  aviso: { color: '#1b6b3a' },
  error: { color: '#a4262c' },
  primario: { padding: '0.5rem 1rem', background: '#0b5a7a', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' },
  secundario: { padding: '0.35rem 0.75rem', background: '#fff', border: '1px solid #9aa8b5', borderRadius: 4, cursor: 'pointer' },
  peligro: { padding: '0.35rem 0.75rem', background: '#fff', color: '#a4262c', border: '1px solid #a4262c', borderRadius: 4, cursor: 'pointer' },
  enlace: { background: 'none', border: 0, color: '#0b5a7a', textDecoration: 'underline', cursor: 'pointer' },
};
