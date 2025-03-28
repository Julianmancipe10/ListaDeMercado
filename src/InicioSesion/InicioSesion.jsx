import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom"; 

function InicioSesion() {
  const { register, handleSubmit, reset } = useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("User signed in:", userCredential.user);
      navigate("/lista");
    } catch (error) {
      setError("Correo o contraseña incorrectos");
      console.error("Error signing in:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User authenticated with Google:", result.user);
      navigate("/lista");
    } catch (error) {
      setError("Error con Google");
      console.error("Error authenticating with Google:", error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("User authenticated with Facebook:", result.user);
      navigate("/lista");
    } catch (error) {
      setError("Error con Facebook");
      console.error("Error authenticating with Facebook:", error);
    }
  };

  const handleGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      console.log("User authenticated with GitHub:", result.user);
      navigate("/lista");
    } catch (error) {
      setError("Error con GitHub");
      console.error("Error authenticating with GitHub:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <p className="text-red-500 text-center bg-red-50 p-2 rounded-md">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input 
                type="email" 
                {...register("email")} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input 
                type="password" 
                {...register("password")} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Iniciar sesión
          </button>

          <div className="text-center">
            <p className="text-gray-600 mb-4">O inicia sesión con:</p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
              >
                Google
              </button>
              <button 
                type="button" 
                onClick={handleFacebookSignIn}
                className="flex items-center justify-center bg-blue-800 text-white py-2 rounded-md hover:bg-blue-900 transition duration-300 ease-in-out"
              >
                Facebook
              </button>
              <button 
                type="button" 
                onClick={handleGithub}
                className="flex items-center justify-center bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900 transition duration-300 ease-in-out"
              >
                GitHub
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InicioSesion;