import React, { useState } from "react";
import axios from "axios";
import "../styles/servicios.css";

export const NuevaFecha = ({ onBack, onSave }) => {
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!fecha) {
      setError("Por favor selecciona una fecha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Apuntamos al puerto 4000 del backend
      await axios.post("http://localhost:4000/api/fechas", { fecha });
      if (onSave) onSave(fecha); // Regresa a la tabla si fue exitoso
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "Error de conexión con el servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fechas-container"
      style={{ textAlign: "center", marginTop: "2rem" }}
    >
      <h1 className="title-blue" style={{ marginBottom: "3rem" }}>
        NUEVA FECHA
      </h1>

      {error && <div className="error-banner">{error}</div>}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
          marginBottom: "4rem",
        }}
      >
        <label style={{ fontSize: "1.2rem", fontWeight: "500" }}>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            border: "1px solid #9ca3af",
            borderRadius: "4px",
            width: "200px",
          }}
          disabled={loading}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
        <button className="btn-atras" onClick={onBack} disabled={loading}>
          Atrás
        </button>
        <button
          className="btn-nuevo"
          onClick={handleGuardar}
          style={{ padding: "0.5rem 3rem" }}
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
};
