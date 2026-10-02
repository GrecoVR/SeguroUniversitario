const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

// ============================================
// REGISTRO DE USUARIO (Tu función)
// ============================================
const register = async (req, res) => {
  console.log('Registro - Body recibido:', req.body);

  const { nombres, apellido_paterno, ci, correo, contrasena, rol } = req.body;

  if (!nombres || !apellido_paterno || !ci || !correo || !contrasena || !rol) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
  }

  if (!['ESTUDIANTE', 'MEDICO', 'ADMINISTRADOR'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido. Debe ser ESTUDIANTE, MEDICO o ADMINISTRADOR' });
  }

  try {
    const existe = await db.query(
      'SELECT * FROM usuarios WHERE correo = $1 OR ci = $2', 
      [correo, ci]
    );
    
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El correo o el CI ya están registrados' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);

    const query = `
      INSERT INTO usuarios (nombres, apellido_paterno, ci, correo, contrasena, rol)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_usuario, nombres, apellido_paterno, ci, correo, rol
    `;
    
    const result = await db.query(query, [nombres, apellido_paterno, ci, correo, contrasenaHash, rol]);
    const usuario = result.rows[0];

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      user: usuario
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// LOGIN (Versión de Enrique - más completa)
// ============================================
const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Por favor, proporcione correo y contraseña' });
  }

  try {
    const result = await db.query(
      `SELECT *, (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > CURRENT_TIMESTAMP) AS bloqueado
       FROM usuarios WHERE correo = $1`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const usuario = result.rows[0];

    if (usuario.bloqueado) {
      return res.status(423).json({ mensaje: 'Cuenta bloqueada temporalmente. Intenta más tarde.' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      await db.query(
        `UPDATE usuarios
         SET intentos_fallidos = intentos_fallidos + 1,
             bloqueado_hasta = CASE
               WHEN intentos_fallidos + 1 >= $2
               THEN CURRENT_TIMESTAMP + make_interval(mins => $3)
               ELSE bloqueado_hasta END
         WHERE id_usuario = $1`,
        [usuario.id_usuario, MAX_INTENTOS, BLOQUEO_MINUTOS]
      );
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    await db.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = $1',
      [usuario.id_usuario]
    );

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
        nombres: usuario.nombres,
        apellido_paterno: usuario.apellido_paterno
      },
      process.env.JWT_SECRET || 'clave_secreta_jwt_ssu_super_segura',
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellido_paterno: usuario.apellido_paterno,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ============================================
// CAMBIAR CONTRASEÑA (De Enrique)
// ============================================
const cambiarContrasena = async (req, res) => {
  const { contrasenaActual, nuevaContrasena } = req.body;
  const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({ mensaje: 'No autorizado. Token no válido o ausente.' });
  }

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id_usuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, 10);

    await db.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [
      nuevaContrasenaHash,
      id_usuario,
    ]);

    res.json({ mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================
module.exports = {
  register,           // ← Tu función
  login,              // ← Versión de Enrique (mejorada)
  cambiarContrasena,  // ← Función de Enrique
};