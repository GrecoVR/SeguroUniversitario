const { Router } = require('express');
const { login, cambiarContrasena } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware'); // Ajusta el nombre/ruta según tu middleware de JWT

const router = Router();

router.post('/login', login);
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena);

module.exports = router;