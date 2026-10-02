const { Router } = require("express");
const {
  crearFecha,
  obtenerFechas,
} = require("../controllers/fechas.controller");

const router = Router();

// MOCK DE LOGIN: Middleware temporal para simular que tienes sesión iniciada
const mockAuth = (req, res, next) => {
  req.usuario = { id_usuario: 1, rol: "MEDICO" };
  next();
};

// Aplicamos el mock en lugar del verificarToken real
router.use(mockAuth);

router.post("/", crearFecha);
router.get("/", obtenerFechas);

module.exports = router;
