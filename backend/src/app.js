const express = require("express");
const cors = require("cors");

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const horariosRoutes = require('./routes/horarios.routes');
const fichasRoutes = require('./routes/fichas.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificación de estado de la API
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor SSU Backend funcionando correctamente",
  });
});

// Rutas

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/fichas', fichasRoutes);
app.use("/api/fechas", require("./routes/fechas.routes"));

app.listen(PORT, () => {
  console.log(`Servidor SSU ejecutándose en el puerto ${PORT}`);
});
