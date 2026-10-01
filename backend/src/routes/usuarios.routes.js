const { Router } = require('express');
const {
  obtenerUsuarios,
  crearUsuario,
  cambiarRolUsuario,
  cambiarContrasena
} = require('../controllers/usuarios.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

// Rutas protegidas para Administrador
router.get('/', verificarToken, verificarRol(['ADMINISTRADOR']), obtenerUsuarios);
router.post('/', verificarToken, verificarRol(['ADMINISTRADOR']), crearUsuario);
router.patch('/:id/rol', verificarToken, verificarRol(['ADMINISTRADOR']), cambiarRolUsuario);
//router.get('/', obtenerUsuarios);
//router.post('/', crearUsuario);
//router.patch('/:id/rol', cambiarRolUsuario);

// Ruta para que cualquier usuario cambie su contraseña
router.put('/cambiar-contrasena', verificarToken, cambiarContrasena);

module.exports = router;