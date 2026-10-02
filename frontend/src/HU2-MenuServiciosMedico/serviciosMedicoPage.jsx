import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { CambiarContrasena } from "../HU24-CambiarContrasena/CambiarContrasena";
import { FechasDisponibles } from "../HU3-FechasDisponibles/components/FechasDisponibles";
import "./styles/servicios.css";

export const ServicioMedicoPage = ({ onLogout, onNavigate }) => {
  const [vistaActual, setVistaActual] = useState("MENU");

  const servicios = [
    { label: "Definir Horarios Disponibles", key: "HORARIOS_DISPONIBLES" },
    { label: "Atender pacientes", key: "ATENDER_PACIENTES" },
    { label: "Cambiar contraseña", key: "CAMBIAR_CONTRASENA" },
  ];

  const handleServiceClick = (key) => {
    if (key === "CAMBIAR_CONTRASENA") {
      setVistaActual("CAMBIAR_CONTRASENA");
    } else if (key === "HORARIOS_DISPONIBLES") {
      setVistaActual("HORARIOS_DISPONIBLES"); // <-- Agrega la redirección a tu vista
    } else if (onNavigate) {
      onNavigate(key);
    }
  };

  const handleVolverAlMenu = () => {
    setVistaActual("MENU");
  };

  return (
    <div className="page-container">
      <Navbar
        activeTab="Servicios"
        onNavigate={(key) => {
          setVistaActual("MENU");
          if (onNavigate) onNavigate(key);
        }}
        onLogout={onLogout}
      />

      <main className="main-content">
        {vistaActual === "CAMBIAR_CONTRASENA" && (
          <CambiarContrasena
            onBack={handleVolverAlMenu}
            onSuccess={handleVolverAlMenu}
          />
        )}

        {/* <-- Renderiza tu componente si la vista es HORARIOS_DISPONIBLES */}
        {vistaActual === "HORARIOS_DISPONIBLES" && (
          <FechasDisponibles onBack={handleVolverAlMenu} />
        )}

        {vistaActual === "MENU" && (
          <>
            <header className="services-header">
              <h1 className="title-blue">SERVICIOS</h1>
            </header>

            <section className="services-menu">
              {servicios.map((servicio) => (
                <button
                  key={servicio.key}
                  className="btn-service"
                  onClick={() => handleServiceClick(servicio.key)}
                >
                  {servicio.label}
                </button>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ServicioMedicoPage;
