import React, { useState, useEffect } from "react";
import axios from "axios";
import { NuevaFecha } from "./NuevaFecha";
import "../styles/servicios.css";

export const FechasDisponibles = ({ onBack }) => {
  const [vista, setVista] = useState("LISTA"); // 'LISTA' o 'NUEVO'
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarFechas = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:4000/api/fechas");
      setFechas(response.data);
    } catch (err) {
      setError("Error al cargar las fechas disponibles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vista === "LISTA") {
      cargarFechas();
    }
  }, [vista]);

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const handleEliminar = async (idFecha) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta fecha?",
    );
    if (!confirmar) return;

    try {
      await axios.delete(`http://localhost:4000/api/fechas/${idFecha}`);
      // Volvemos a cargar la tabla para reflejar el cambio
      cargarFechas();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar la fecha");
    }
  };

  if (vista === "NUEVO") {
    return (
      <NuevaFecha
        onBack={() => setVista("LISTA")}
        onSave={() => {
          setVista("LISTA");
        }}
      />
    );
  }

  return (
    <div className="fechas-container">
      <div className="fechas-header">
        <h1 className="title-blue">FECHAS DISPONIBLES</h1>
        <button className="btn-nuevo" onClick={() => setVista("NUEVO")}>
          Nuevo
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <table className="fechas-table">
        <thead>
          <tr>
            <th>NRO</th>
            <th>Fecha</th>
            <th>Asignar Horarios</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                Cargando...
              </td>
            </tr>
          ) : fechas.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                No hay fechas registradas.
              </td>
            </tr>
          ) : (
            fechas.map((item, index) => (
              <tr key={item.idFecha}>
                <td>{index + 1}</td>
                <td>📝 {item.fecha}</td>
                <td className="icon-cell">📝</td>
                {/* Conectamos el evento de eliminar al ícono */}
                <td
                  className="icon-cell"
                  onClick={() => handleEliminar(item.idFecha)}
                  title="Eliminar fecha"
                >
                  🗑️
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="fechas-footer">
        <button className="btn-atras" onClick={onBack}>
          Atrás
        </button>
      </div>
    </div>
  );
};
