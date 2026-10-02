const { Router } = require("express");
const {
  crearFecha,
  obtenerFechas,
  eliminarFecha,
} = require("../controllers/fechas.controller");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/auth.middleware");

const router = Router();

// Protegemos todas las rutas de fechas exigiendo un Token válido y el rol de MEDICO
router.use(verificarToken, verificarRol(["MEDICO"]));

router.post("/", crearFecha);
router.get("/", obtenerFechas);
router.delete("/:id", eliminarFecha);
module.exports = router;
