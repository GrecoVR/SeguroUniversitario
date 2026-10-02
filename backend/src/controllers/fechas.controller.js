const db = require("../config/db");

// POST /api/fechas
const crearFecha = async (req, res) => {
  const { fecha } = req.body;
  const idMedico = req.usuario.id_usuario;

  if (!fecha)
    return res.status(400).json({ mensaje: "La fecha es obligatoria" });

  try {
    const result = await db.query(
      `INSERT INTO fechas_disponibles (id_medico, fecha)
       VALUES ($1, $2)
       RETURNING id_fecha AS "idFecha", id_medico AS "idMedico", to_char(fecha, 'YYYY-MM-DD') AS fecha`,
      [idMedico, fecha],
    );
    res.status(201).json({ mensaje: "Fecha creada", fecha: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      // Código de PostgreSQL para constraint UNIQUE (uq_medico_fecha)
      return res
        .status(409)
        .json({ mensaje: "Ya tienes esta fecha registrada en tu agenda" });
    }
    res.status(500).json({ mensaje: "Error al crear la fecha" });
  }
};

// GET /api/fechas
const obtenerFechas = async (req, res) => {
  const idMedico = req.usuario.id_usuario;
  try {
    const result = await db.query(
      `SELECT id_fecha AS "idFecha", to_char(fecha, 'YYYY-MM-DD') AS fecha
       FROM fechas_disponibles
       WHERE id_medico = $1
       ORDER BY fecha ASC`,
      [idMedico],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener fechas" });
  }
};

module.exports = { crearFecha, obtenerFechas };
