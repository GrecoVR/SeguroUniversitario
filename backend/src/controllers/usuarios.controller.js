const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (Exclusivo Administrador)
const obtenerUsuarios = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id_usuario, nombres, apellido_paterno, apellido_materno, codigo_sis, ci, celular, correo, rol, creado_en FROM usuarios ORDER BY id_usuario DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// Crear usuario (Por defecto la contraseña es su CI y el rol es ESTUDIANTE)
const crearUsuario = async (req, res) => {
  const { nombres, apellido_paterno, apellido_materno, codigo_sis, ci, celular, correo, rol } = req.body;

  if (!nombres || !apellido_paterno || !ci || !correo) {
    return res.status(400).json({ mensaje: 'Los campos nombres, apellido paterno, CI y correo son obligatorios' });
  }

  try {
    // Hashear el CI como contraseña por defecto
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(ci.toString(), salt);

    const rolAsignado = rol || 'ESTUDIANTE';

    const result = await db.query(
      `INSERT INTO usuarios (nombres, apellido_paterno, apellido_materno, codigo_sis, ci, celular, correo, contrasena, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_usuario, nombres, apellido_paterno, ci, correo, rol`,
      [nombres, apellido_paterno, apellido_materno || null, codigo_sis || null, ci, celular || null, correo, contrasenaHash, rolAsignado]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === '23505') { // Violación de unicidad en PG (CI, correo o Código SIS duplicado)
      return res.status(400).json({ mensaje: 'El CI, Correo o Código SIS ya se encuentra registrado' });
    }
    res.status(500).json({ mensaje: 'Error al crear el usuario' });
  }
};

// Cambiar rol de un usuario (Exclusivo Administrador)
const cambiarRolUsuario = async (req, res) => {
  const { id } = req.params;
  const { nuevo_rol } = req.body;

  const rolesValidos = ['ADMINISTRADOR', 'MEDICO', 'ESTUDIANTE'];
  if (!rolesValidos.includes(nuevo_rol)) {
    return res.status(400).json({ mensaje: 'Rol no válido' });
  }

  try {
    const result = await db.query(
      'UPDATE usuarios SET rol = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombres, apellido_paterno, rol',
      [nuevo_rol, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Rol actualizado correctamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el rol' });
  }
};

// Cambiar propia contraseña (Para cualquier usuario autenticado)
const cambiarContrasena = async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const { contrasena_actual, nueva_contrasena } = req.body;

  if (!contrasena_actual || !nueva_contrasena) {
    return res.status(400).json({ mensaje: 'Proporcione la contraseña actual y la nueva contraseña' });
  }

  try {
    const resUser = await db.query('SELECT contrasena FROM usuarios WHERE id_usuario = $1', [id_usuario]);
    const usuario = resUser.rows[0];

    const esCorrecta = await bcrypt.compare(contrasena_actual, usuario.contrasena);
    if (!esCorrecta) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(nueva_contrasena, salt);

    await db.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [nuevaHash, id_usuario]);

    res.json({ mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  cambiarRolUsuario,
  cambiarContrasena,
};