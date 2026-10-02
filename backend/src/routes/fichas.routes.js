const express = require('express');

const {
	obtenerFichas,
	obtenerHorariosDisponibles,
	crearFicha,
	actualizarFicha,
	eliminarFicha
} = require('../controllers/fichas.controller');

const router = express.Router();

router.get('/horarios-disponibles', obtenerHorariosDisponibles);
router.get('/', obtenerFichas);
router.post('/', crearFicha);
router.put('/:id', actualizarFicha);
router.delete('/:id', eliminarFicha);

module.exports = router;
