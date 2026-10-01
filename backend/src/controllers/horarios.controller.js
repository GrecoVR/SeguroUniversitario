const db = require('../config/db');

const REGEX_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ---------- Utilidades ---------- */

const errorHttp = (status, mensaje) => Object.assign(new Error(mensaje), { status });

// Fecha y hora actuales en Bolivia (el contenedor Docker suele estar en UTC)
const ahoraBolivia = () => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (tipo) => partes.find((p) => p.type === tipo).value;
  return {
    fecha: `${get('year')}-${get('month')}-${get('day')}`,
    hora: `${get('hour')}:${get('minute')}`,
  };
};

const fechaValida = (texto) => {
  const m = REGEX_FECHA.exec(texto);
  if (!m) return false;
  const anio = +m[1];
  const mes = +m[2];
  const dia = +m[3];
  const f = new Date(Date.UTC(anio, mes - 1, dia));
  return f.getUTCFullYear() === anio && f.getUTCMonth() === mes - 1 && f.getUTCDate() === dia;
};

// Devuelve un mensaje de error o null si los datos son válidos
const validarDatos = ({ fecha, hora_inicio, hora_fin }) => {
  if (!fecha || !hora_inicio || !hora_fin) {
    return 'La fecha, la hora de inicio y la hora de fin son obligatorias';
  }
  if (!fechaValida(fecha)) return 'La fecha no es válida (formato AAAA-MM-DD)';
  if (!REGEX_HORA.test(hora_inicio) || !REGEX_HORA.test(hora_fin)) {
    return 'Las horas deben tener el formato HH:MM';
  }
  if (hora_fin <= hora_inicio) return 'La hora de fin debe ser posterior a la hora de inicio';

  const ahora = ahoraBolivia();
  if (fecha < ahora.fecha) return 'No se pueden registrar horarios en fechas pasadas';
  if (fecha === ahora.fecha && hora_inicio <= ahora.hora) {
    return 'La hora de inicio ya pasó para el día de hoy';
  }
  return null;
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const conTransaccion = async (fn) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const responderError = (res, error, mensajeGenerico) => {
  if (error.status) return res.status(error.status).json({ mensaje: error.message });
  console.error(mensajeGenerico, error);
  return res.status(500).json({ mensaje: mensajeGenerico });
};

/* ---------- Consultas reutilizables ---------- */

const obtenerOCrearFecha = async (client, idMedico, fecha) => {
  const r = await client.query(
    `INSERT INTO fechas_disponibles (id_medico, fecha)
     VALUES ($1, $2)
     ON CONFLICT (id_medico, fecha) DO UPDATE SET fecha = EXCLUDED.fecha
     RETURNING id_fecha`,
    [idMedico, fecha]
  );
  return r.rows[0].id_fecha;
};

const hayConflictoDeHorario = async (client, idFecha, horaInicio, horaFin, excluirId = 0) => {
  const r = await client.query(
    `SELECT 1 FROM horarios
     WHERE id_fecha = $1
       AND id_horario <> $2
       AND hora_inicio < $4::time
       AND hora_fin > $3::time
     LIMIT 1`,
    [idFecha, excluirId, horaInicio, horaFin]
  );
  return r.rows.length > 0;
};

// Busca un horario y verifica que pertenezca al médico autenticado
const obtenerHorarioPropio = async (client, idHorario, idMedico) => {
  const r = await client.query(
    `SELECT h.id_horario, h.id_fecha
     FROM horarios h
     JOIN fechas_disponibles f ON f.id_fecha = h.id_fecha
     WHERE h.id_horario = $1 AND f.id_medico = $2`,
    [idHorario, idMedico]
  );
  if (r.rows.length === 0) throw errorHttp(404, 'Horario no encontrado');
  return r.rows[0];
};

const verificarSinFicha = async (client, idHorario) => {
  const r = await client.query('SELECT 1 FROM fichas WHERE id_horario = $1 LIMIT 1', [idHorario]);
  if (r.rows.length > 0) {
    throw errorHttp(409, 'El horario ya tiene una ficha reservada y no se puede modificar ni eliminar');
  }
};

const limpiarFechaVacia = async (client, idFecha) => {
  await client.query(
    `DELETE FROM fechas_disponibles
     WHERE id_fecha = $1
       AND NOT EXISTS (SELECT 1 FROM horarios WHERE id_fecha = $1)`,
    [idFecha]
  );
};

/* ---------- HU6: consultar horarios ---------- */

// GET /api/horarios?fecha=AAAA-MM-DD  (el filtro es opcional)
const listarHorarios = async (req, res) => {
  const { fecha } = req.query;

  if (fecha && !fechaValida(fecha)) {
    return res.status(400).json({ mensaje: 'La fecha del filtro no es válida (formato AAAA-MM-DD)' });
  }

  try {
    const params = [req.usuario.id_usuario];
    let filtro = '';
    if (fecha) {
      params.push(fecha);
      filtro = 'AND f.fecha = $2';
    }

    const result = await db.query(
      `SELECT h.id_horario,
              f.id_fecha,
              to_char(f.fecha, 'YYYY-MM-DD') AS fecha,
              to_char(h.hora_inicio, 'HH24:MI') AS hora_inicio,
              to_char(h.hora_fin, 'HH24:MI') AS hora_fin,
              (fi.id_ficha IS NOT NULL) AS reservado
       FROM fechas_disponibles f
       JOIN horarios h ON h.id_fecha = f.id_fecha
       LEFT JOIN fichas fi ON fi.id_horario = h.id_horario
       WHERE f.id_medico = $1 ${filtro}
       ORDER BY f.fecha, h.hora_inicio`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    responderError(res, error, 'Error al obtener los horarios');
  }
};


// POST /api/horarios  { fecha, hora_inicio, hora_fin }
const crearHorario = async (req, res) => {
  const { fecha, hora_inicio, hora_fin } = req.body;

  const errorValidacion = validarDatos({ fecha, hora_inicio, hora_fin });
  if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

  try {
    const horario = await conTransaccion(async (client) => {
      const idFecha = await obtenerOCrearFecha(client, req.usuario.id_usuario, fecha);

      if (await hayConflictoDeHorario(client, idFecha, hora_inicio, hora_fin)) {
        throw errorHttp(409, 'El horario se solapa con otro horario ya registrado en esa fecha');
      }

      const r = await client.query(
        `INSERT INTO horarios (id_fecha, hora_inicio, hora_fin)
         VALUES ($1, $2, $3)
         RETURNING id_horario`,
        [idFecha, hora_inicio, hora_fin]
      );

      return {
        id_horario: r.rows[0].id_horario,
        id_fecha: idFecha,
        fecha,
        hora_inicio,
        hora_fin,
        reservado: false,
      };
    });

    res.status(201).json({ mensaje: 'Horario creado correctamente', horario });
  } catch (error) {
    responderError(res, error, 'Error al crear el horario');
  }
};


// PUT /api/horarios/:id  { fecha, hora_inicio, hora_fin }
const actualizarHorario = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora_inicio, hora_fin } = req.body;

  if (!idValido(id)) return res.status(400).json({ mensaje: 'Identificador de horario no válido' });

  const errorValidacion = validarDatos({ fecha, hora_inicio, hora_fin });
  if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

  try {
    const horario = await conTransaccion(async (client) => {
      const idMedico = req.usuario.id_usuario;
      const actual = await obtenerHorarioPropio(client, id, idMedico);

      await verificarSinFicha(client, id);

      const idFechaNueva = await obtenerOCrearFecha(client, idMedico, fecha);

      if (await hayConflictoDeHorario(client, idFechaNueva, hora_inicio, hora_fin, Number(id))) {
        throw errorHttp(409, 'El horario se solapa con otro horario ya registrado en esa fecha');
      }

      await client.query(
        `UPDATE horarios
         SET id_fecha = $1, hora_inicio = $2, hora_fin = $3
         WHERE id_horario = $4`,
        [idFechaNueva, hora_inicio, hora_fin, id]
      );

      if (actual.id_fecha !== idFechaNueva) {
        await limpiarFechaVacia(client, actual.id_fecha);
      }

      return {
        id_horario: Number(id),
        id_fecha: idFechaNueva,
        fecha,
        hora_inicio,
        hora_fin,
        reservado: false,
      };
    });

    res.json({ mensaje: 'Horario actualizado correctamente', horario });
  } catch (error) {
    responderError(res, error, 'Error al actualizar el horario');
  }
};


// DELETE /api/horarios/:id
const eliminarHorario = async (req, res) => {
  const { id } = req.params;

  if (!idValido(id)) return res.status(400).json({ mensaje: 'Identificador de horario no válido' });

  try {
    await conTransaccion(async (client) => {
      const actual = await obtenerHorarioPropio(client, id, req.usuario.id_usuario);
      await verificarSinFicha(client, id);
      await client.query('DELETE FROM horarios WHERE id_horario = $1', [id]);
      await limpiarFechaVacia(client, actual.id_fecha);
    });

    res.json({ mensaje: 'Horario eliminado correctamente' });
  } catch (error) {
    responderError(res, error, 'Error al eliminar el horario');
  }
};

module.exports = {
  listarHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
};
