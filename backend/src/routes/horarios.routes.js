const { Router } = require('express');
const {
  listarHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
} = require('../controllers/horarios.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas requieren sesión iniciada y rol MEDICO
router.use(verificarToken, verificarRol(['MEDICO']));

router.get('/', listarHorarios);
router.post('/', crearHorario);
router.put('/:id', actualizarHorario);
router.delete('/:id', eliminarHorario);

module.exports = router;