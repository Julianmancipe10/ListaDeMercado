import React from 'react'
import { useNavigate } from 'react-router-dom'
import "./index.css"

export default function 
Home() {
    const navigate=useNavigate();
  return (

    
    <div className="Welcome">

        <header>
          <img src="/src/assets/Images/icono.jpg" alt="" />
          <h1 className='principal-h1'>Lista de Compras</h1>

        </header>

    <div className="contenedor">
      <h1>Bienvenido</h1>
      <p>La mejor Página de apuntes del mercado</p>
      <button onClick={() => navigate("/lista")}>Crear lista</button>
      <button onClick={() => navigate("/inicioSesion")}>Iniciar Sesión</button>
      <button onClick={() => navigate("/registrer")}>RegistrarUsuario</button>
      
    </div>
  </div>
  
  )
}
