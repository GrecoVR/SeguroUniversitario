const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login de Usuario mediante Correo y Contraseña
const login = async (req, res) => {

  console.log('Headers recibidos:', req.headers['content-type']);
  console.log('Body recibido:', req.body);

  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Por favor, proporcione correo y contraseña' });
  }

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    // Verificar contraseña con bcrypt
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Generar Token JWT
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

// Cambiar Contraseña del Usuario Autenticado
const cambiarContrasena = async (req, res) => {
  const { contrasenaActual, nuevaContrasena } = req.body;
  // Obtiene id_usuario desde req.usuario o req.user según tu middleware de autenticación
  const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({ mensaje: 'No autorizado. Token no válido o ausente.' });
  }

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    // 1. Consultar usuario actual en PostgreSQL
    const result = await db.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id_usuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    // 2. Verificar si la contraseña actual ingresada coincide con el hash en BD
    const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    // 3. Generar hash para la nueva contraseña
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, 10);

    // 4. Actualizar la contraseña en la base de datos
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

module.exports = {
  login,
  cambiarContrasena,
};