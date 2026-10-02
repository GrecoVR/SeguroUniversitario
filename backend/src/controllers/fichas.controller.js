const db = require('../config/db');

const seleccionFicha = `
  SELECT
    fi.id_ficha AS id,
    fi.nro,
    fi.id_medico AS "idDoctor",
    fi.id_estudiante AS "idEstudiante",
    fi.id_horario AS "idHorario",
    fi.activo,
    fi.estado,
    fd.fecha,
    h.hora_inicio AS hora,
    h.hora_fin AS "horaFin",
    u.nombres AS "nombresDoctor",
    u.apellido_paterno AS "apellidoDoctor"
  FROM fichas fi
  INNER JOIN fechas_disponibles fd ON fd.id_fecha = fi.id_fecha
  INNER JOIN horarios h ON h.id_horario = fi.id_horario
  INNER JOIN usuarios u ON u.id_usuario = fi.id_medico
`;

const esEnteroPositivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const obtenerFichas = async (req, res) => {
  const { id_estudiante } = req.query;

  if (!id_estudiante || !esEnteroPositivo(id_estudiante)) {
    return res.status(400).json({ mensaje: 'El id_estudiante debe ser un entero positivo' });
  }

  try {
    const result = await db.query(
      `${seleccionFicha} WHERE fi.id_estudiante = $1 ORDER BY fi.nro DESC`,
      [Number(id_estudiante)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener fichas:', error);
    res.status(500).json({ mensaje: 'Error al obtener las fichas' });
  }
};

const obtenerHorariosDisponibles = async (req, res) => {
  const { fecha, id_doctor } = req.query;

  if (id_doctor && !esEnteroPositivo(id_doctor)) {
    return res.status(400).json({ mensaje: 'El id_doctor debe ser un entero positivo' });
  }

  try {
    const params = [];
    const filtros = [];

    if (fecha) {
      params.push(fecha);
      filtros.push(`fd.fecha = $${params.length}`);
    }

    if (id_doctor) {
      params.push(Number(id_doctor));
      filtros.push(`fd.id_medico = $${params.length}`);
    }

    const where = filtros.length ? `AND ${filtros.join(' AND ')}` : '';
    const result = await db.query(`
      SELECT
        h.id_horario AS id,
        h.id_horario AS "idHorario",
        fd.id_medico AS "idDoctor",
        fd.fecha,
        h.hora_inicio AS hora,
        h.hora_fin AS "horaFin",
        u.nombres AS "nombresDoctor",
        u.apellido_paterno AS "apellidoDoctor"
      FROM horarios h
      INNER JOIN fechas_disponibles fd ON fd.id_fecha = h.id_fecha
      INNER JOIN usuarios u ON u.id_usuario = fd.id_medico
      WHERE NOT EXISTS (
        SELECT 1 FROM fichas fi
        WHERE fi.id_horario = h.id_horario AND fi.activo = TRUE
      )
      AND (fd.fecha > CURRENT_DATE OR (fd.fecha = CURRENT_DATE AND h.hora_inicio > LOCALTIME))
      ${where}
      ORDER BY fd.fecha ASC, h.hora_inicio ASC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    res.status(500).json({ mensaje: 'Error al obtener los horarios disponibles' });
  }
};

const crearFicha = async (req, res) => {
  const { id_estudiante, id_horario } = req.body;

  if (!esEnteroPositivo(id_estudiante) || !esEnteroPositivo(id_horario)) {
    return res.status(400).json({ mensaje: 'id_estudiante e id_horario deben ser enteros positivos' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const estudiante = await client.query(
      `SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND rol = 'ESTUDIANTE'`,
      [Number(id_estudiante)]
    );

    if (estudiante.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El estudiante no existe' });
    }

    const horario = await client.query(
      `SELECT h.id_horario, h.id_fecha, fd.id_medico
       FROM horarios h
       INNER JOIN fechas_disponibles fd ON fd.id_fecha = h.id_fecha
       WHERE h.id_horario = $1
      AND (fd.fecha > CURRENT_DATE OR (fd.fecha = CURRENT_DATE AND h.hora_inicio > LOCALTIME))
       FOR UPDATE OF h`,
      [Number(id_horario)]
    );

    if (horario.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El horario no existe' });
    }

    const reserva = await client.query(
      'SELECT id_ficha FROM fichas WHERE id_horario = $1 AND activo = TRUE',
      [Number(id_horario)]
    );

    if (reserva.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Ese horario ya fue reservado' });
    }

    const datosHorario = horario.rows[0];
    const insertada = await client.query(
      `INSERT INTO fichas (id_estudiante, id_medico, id_fecha, id_horario)
       VALUES ($1, $2, $3, $4)
       RETURNING id_ficha`,
      [Number(id_estudiante), datosHorario.id_medico, datosHorario.id_fecha, Number(id_horario)]
    );

    const ficha = await client.query(
      `${seleccionFicha} WHERE fi.id_ficha = $1`,
      [insertada.rows[0].id_ficha]
    );

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Ficha creada exitosamente', ficha: ficha.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear ficha:', error);

    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese horario ya fue reservado' });
    }

    res.status(500).json({ mensaje: 'Error al crear la ficha' });
  } finally {
    client.release();
  }
};

const actualizarFicha = async (req, res) => {
  const { id } = req.params;
  const { id_horario, activo } = req.body;

  if (!esEnteroPositivo(id)) {
    return res.status(400).json({ mensaje: 'El id de ficha debe ser un entero positivo' });
  }

  if (id_horario !== undefined && !esEnteroPositivo(id_horario)) {
    return res.status(400).json({ mensaje: 'id_horario debe ser un entero positivo' });
  }

  if (activo !== undefined && typeof activo !== 'boolean') {
    return res.status(400).json({ mensaje: 'activo debe ser verdadero o falso' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const actual = await client.query(
      'SELECT id_ficha, id_horario, activo FROM fichas WHERE id_ficha = $1 FOR UPDATE',
      [Number(id)]
    );

    if (actual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Ficha no encontrada' });
    }

    const idHorario = Number(id_horario || actual.rows[0].id_horario);
    const horario = await client.query(
      `SELECT h.id_horario, h.id_fecha, fd.id_medico
       FROM horarios h
       INNER JOIN fechas_disponibles fd ON fd.id_fecha = h.id_fecha
       WHERE h.id_horario = $1
      AND (fd.fecha > CURRENT_DATE OR (fd.fecha = CURRENT_DATE AND h.hora_inicio > LOCALTIME))
       FOR UPDATE OF h`,
      [idHorario]
    );

    if (horario.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El horario no existe' });
    }

    const activoNuevo = activo === undefined ? actual.rows[0].activo : activo;
    if (activoNuevo) {
      const reserva = await client.query(
        `SELECT id_ficha FROM fichas
         WHERE id_horario = $1 AND activo = TRUE AND id_ficha <> $2`,
        [idHorario, Number(id)]
      );

      if (reserva.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'Ese horario ya fue reservado' });
      }
    }

    const datosHorario = horario.rows[0];
    await client.query(
      `UPDATE fichas
       SET id_medico = $1,
           id_fecha = $2,
           id_horario = $3,
           activo = $4,
           estado = CASE WHEN $4 THEN 'PENDIENTE'::estado_ficha ELSE 'CANCELADO'::estado_ficha END
       WHERE id_ficha = $5`,
      [datosHorario.id_medico, datosHorario.id_fecha, idHorario, activoNuevo, Number(id)]
    );

    const ficha = await client.query(
      `${seleccionFicha} WHERE fi.id_ficha = $1`,
      [Number(id)]
    );

    await client.query('COMMIT');
    res.json({ mensaje: 'Ficha actualizada correctamente', ficha: ficha.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar ficha:', error);

    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese horario ya fue reservado' });
    }

    res.status(500).json({ mensaje: 'Error al actualizar la ficha' });
  } finally {
    client.release();
  }
};

const eliminarFicha = async (req, res) => {
  const { id } = req.params;

  if (!esEnteroPositivo(id)) {
    return res.status(400).json({ mensaje: 'El id de ficha debe ser un entero positivo' });
  }

  try {
    const result = await db.query(
      `UPDATE fichas
       SET activo = FALSE, estado = 'CANCELADO'
       WHERE id_ficha = $1 AND activo = TRUE
       RETURNING id_ficha`,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Ficha activa no encontrada' });
    }

    res.json({ mensaje: 'Ficha cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar ficha:', error);
    res.status(500).json({ mensaje: 'Error al cancelar la ficha' });
  }
};

module.exports = {
  obtenerFichas,
  obtenerHorariosDisponibles,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
};