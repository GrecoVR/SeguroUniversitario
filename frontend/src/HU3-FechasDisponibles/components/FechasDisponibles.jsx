import React, { useState } from "react";
import { NuevaFecha } from "./NuevaFecha";
import "../styles/servicios.css";

export const FechasDisponibles = ({ onBack }) => {
  const [vista, setVista] = useState("LISTA"); // 'LISTA' o 'NUEVO'

  // Datos estáticos temporales
  const fechas = [
    { id: 2, fecha: "14/09/2026" },
    { id: 1, fecha: "12/09/2026" },
  ];

  if (vista === "NUEVO") {
    return (
      <NuevaFecha
        onBack={() => setVista("LISTA")}
        onSave={(nuevaFecha) => {
          console.log("Guardando...", nuevaFecha);
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
          {fechas.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>📝 {item.fecha}</td>
              <td className="icon-cell">📝</td>
              <td className="icon-cell">🗑️</td>
            </tr>
          ))}
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
