import React, { useState } from 'react';
import './styles/servicios.css';

export const CambiarContrasena = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    repetirContrasena: '',
  });

  // Estado para alternar la visibilidad de cada contraseña
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    repetir: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const toggleVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones del lado del cliente
    if (!formData.contrasenaActual || !formData.nuevaContrasena || !formData.repetirContrasena) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (formData.nuevaContrasena !== formData.repetirContrasena) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (formData.nuevaContrasena.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesión no encontrada. Por favor, vuelva a iniciar sesión.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:4000/api/auth/cambiar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contrasenaActual: formData.contrasenaActual,
          nuevaContrasena: formData.nuevaContrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al cambiar la contraseña.');
      }

      setSuccess('Contraseña actualizada con éxito.');
      setFormData({ contrasenaActual: '', nuevaContrasena: '', repetirContrasena: '' });

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2 className="title-blue">CAMBIAR CONTRASEÑA</h2>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="contrasenaActual">Contraseña actual:</label>
          <div className="input-with-button">
            <input
              id="contrasenaActual"
              type={showPasswords.actual ? 'text' : 'password'}
              name="contrasenaActual"
              value={formData.contrasenaActual}
              onChange={handleChange}
              placeholder="**********"
            />
            <button
              type="button"
              className="btn-toggle-show"
              onClick={() => toggleVisibility('actual')}
            >
              {showPasswords.actual ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="nuevaContrasena">Nueva contraseña:</label>
          <div className="input-with-button">
            <input
              id="nuevaContrasena"
              type={showPasswords.nueva ? 'text' : 'password'}
              name="nuevaContrasena"
              value={formData.nuevaContrasena}
              onChange={handleChange}
              placeholder="************"
            />
            <button
              type="button"
              className="btn-toggle-show"
              onClick={() => toggleVisibility('nueva')}
            >
              {showPasswords.nueva ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="repetirContrasena">Repita nueva contraseña:</label>
          <div className="input-with-button">
            <input
              id="repetirContrasena"
              type={showPasswords.repetir ? 'text' : 'password'}
              name="repetirContrasena"
              value={formData.repetirContrasena}
              onChange={handleChange}
              placeholder="************"
            />
            <button
              type="button"
              className="btn-toggle-show"
              onClick={() => toggleVisibility('repetir')}
            >
              {showPasswords.repetir ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Atrás
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CambiarContrasena;