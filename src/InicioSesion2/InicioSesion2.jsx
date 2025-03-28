import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { useNavigate } from "react-router-dom";

function InicioSesion2() {
  const { register, handleSubmit, reset, watch } = useForm(); 
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        let photoURL = "";
        if (data.file[0]) {
            const storage = getStorage();
            const storageRef = ref(storage, `profilePictures/${user.uid}`);
            await uploadBytes(storageRef, data.file[0]);
            photoURL = await getDownloadURL(storageRef);
        }

        await updateProfile(user, { displayName: data.name, photoURL });

        setSuccessMessage("Registro exitoso. ¡Bienvenido!");
        reset();

        console.log("Usuario registrado, redirigiendo...");
        navigate("/lista");
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            setError("El correo ya está registrado. Inicia sesión o usa otro email.");
        } else {
            setError("Error al registrar usuario: " + error.message);
        }
        console.error("Error:", error);    
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Usuario autenticado con Google:", result.user);
      navigate("/lista");
    } catch (error) {
      setError(error.message);
      console.error("Error autenticando con Google:", error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("Usuario autenticado con Facebook:", result.user);
      navigate("/lista");
    } catch (error) {
      setError(error.message);
      console.error("Error autenticando con Facebook:", error);
    }
  };

  const handleGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      console.log("Usuario autenticado con GitHub:", result.user);
      navigate("/lista");
    } catch (error) {
      setError(error.message);
      console.error("Error autenticando con GitHub:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Success and Error Messages */}
          {successMessage && (
            <p className="text-green-600 text-center bg-green-50 p-2 rounded-md">
              {successMessage}
            </p>
          )}
          {error && (
            <p className="text-red-500 text-center bg-red-50 p-2 rounded-md">
              {error}
            </p>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                {...register("name")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password Inputs */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                {...register("password")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                {...register("confirmPassword")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Birthdate Input */}
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                {...register("birthdate")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country Select */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <select
                {...register("country")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mx">México</option>
                <option value="co">Colombia</option>
                <option value="ar">Argentina</option>
              </select>
            </div>

            {/* Profile Picture Input */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil
              </label>
              <input
                type="file"
                {...register("file")}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register("terms")}
                required
                className="mr-2 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Acepto los términos y condiciones
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Registrarse
          </button>

          {/* Social Login Section */}
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

export default InicioSesion2;