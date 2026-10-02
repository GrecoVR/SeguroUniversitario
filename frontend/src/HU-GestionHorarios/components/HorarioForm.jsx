import { useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const horaActual = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Devuelve un mensaje de error o '' si todo está bien
const validar = ({ fecha, hora_inicio, hora_fin }) => {
  if (!fecha || !hora_inicio || !hora_fin) {
    return 'Completa la fecha, la hora de inicio y la hora de fin.';
  }
  if (hora_fin <= hora_inicio) {
    return 'La hora de fin debe ser posterior a la hora de inicio.';
  }
  if (fecha < hoyLocal()) {
    return 'Elige una fecha de hoy en adelante.';
  }
  if (fecha === hoyLocal() && hora_inicio <= horaActual()) {
    return 'La hora de inicio ya pasó. Elige una hora posterior a la actual.';
  }
  return '';
};

// Si recibe `inicial` funciona en modo edición; si no, en modo creación.
export default function HorarioForm({ inicial, onGuardar, onCancelar, enviando, errorServidor }) {
  const editando = Boolean(inicial);

  const [datos, setDatos] = useState({
    fecha: inicial?.fecha || '',
    hora_inicio: inicial?.hora_inicio || '',
    hora_fin: inicial?.hora_fin || '',
  });
  const [error, setError] = useState('');

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  const enviar = (e) => {
    e.preventDefault();
    const mensaje = validar(datos);
    if (mensaje) return setError(mensaje);
    setError('');
    onGuardar(datos);
  };

  const mensajeError = error || errorServidor;

  return (
    <form onSubmit={enviar} style={estilos.form} noValidate>
      <h2 style={estilos.titulo}>{editando ? 'Editar horario' : 'Nuevo horario'}</h2>

      <label style={estilos.campo}>
        Fecha
        <input type="date" name="fecha" value={datos.fecha} min={hoyLocal()} onChange={cambiar} style={estilos.input} />
      </label>

      <div style={estilos.fila}>
        <label style={estilos.campo}>
          Hora de inicio
          <input type="time" name="hora_inicio" value={datos.hora_inicio} onChange={cambiar} style={estilos.input} />
        </label>
        <label style={estilos.campo}>
          Hora de fin
          <input type="time" name="hora_fin" value={datos.hora_fin} onChange={cambiar} style={estilos.input} />
        </label>
      </div>

      {mensajeError && (
        <p role="alert" style={estilos.error}>
          {mensajeError}
        </p>
      )}

      <div style={estilos.acciones}>
        <button type="button" onClick={onCancelar} disabled={enviando} style={estilos.secundario}>
          Cancelar
        </button>
        <button type="submit" disabled={enviando} style={estilos.primario}>
          {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar horario'}
        </button>
      </div>
    </form>
  );
}

const estilos = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.25rem',
    border: '1px solid #c9d3dd',
    borderRadius: 8,
    background: '#fff',
    maxWidth: 420,
  },
  titulo: { margin: 0, fontSize: '1.15rem' },
  fila: { display: 'flex', gap: '1rem' },
  campo: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, fontSize: '0.9rem' },
  input: { padding: '0.5rem', fontSize: '1rem', border: '1px solid #9aa8b5', borderRadius: 4 },
  error: { margin: 0, color: '#a4262c', fontSize: '0.9rem' },
  acciones: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  primario: { padding: '0.5rem 1rem', background: '#0b5a7a', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' },
  secundario: { padding: '0.5rem 1rem', background: '#fff', border: '1px solid #9aa8b5', borderRadius: 4, cursor: 'pointer' },
};
