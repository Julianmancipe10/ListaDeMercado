import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
            <header className="mb-12 text-center">
                <img 
                    src="https://imgur.com/a/EfINL4H" 
                    alt="App Icon" 
                    className="mx-auto w-24 h-24 rounded-full shadow-lg mb-4 object-cover"
                />
                <h1 className="text-3xl font-bold text-blue-800">Lista de Compras</h1>
            </header>

            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
                <h1 className="text-2xl font-semibold text-gray-800 mb-4">Bienvenido</h1>
                <p className="text-gray-600 mb-6">La mejor Página de apuntes del mercado</p>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate("/inicioSesion")}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                    >
                        Iniciar Sesión
                    </button>
                    <button 
                        onClick={() => navigate("/registrer")}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                    >
                        Registrar Usuario
                    </button>
                </div>
            </div>
        </div>
    )
}