import { useState, useEffect } from 'react'
import LoginForm from './LoginForm'
import { ServicioEstudiantePage } from './HU12-MenuServiciosEstudiante/serviciosEstudiantePage'
import { ServicioMedicoPage } from './HU2-MenuServiciosMedico/serviciosMedicoPage'
import './App.css'

export default function App() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const guardado = localStorage.getItem('usuario')
    if (guardado) setUsuario(JSON.parse(guardado))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
    setUsuario(null)
  }

  const handleNavigate = (key) => {
    console.log('Navegar a:', key)
  }

  if (usuario) {
    return usuario.rol === 'MEDICO' ? (
      <ServicioMedicoPage onLogout={handleLogout} onNavigate={handleNavigate} />
    ) : (
      <ServicioEstudiantePage onLogout={handleLogout} onNavigate={handleNavigate} />
    )
  }

  return (
    <>
      <header className="barra">
        <span>Seguro social universitario</span>
        <span>Iniciar Sesión</span>
      </header>
      <main className="contenido">
        <LoginForm onLogin={setUsuario} />
      </main>
    </>
  )
}