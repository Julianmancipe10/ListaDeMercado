import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom"; 
import "./InicioSesion.css";

function InicioSesion() {
  const { register, handleSubmit, reset } = useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook para redirigir

  //Inicio de sesión con correo y contraseña
  const onSubmit = async (data) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("User signed in:", userCredential.user);
      navigate("/lista"); //Redirige después de iniciar sesión
    } catch (error) {
      setError("Correo o contraseña incorrectos");
      console.error("Error signing in:", error);
    }
  };

  // Inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User authenticated with Google:", result.user);
      navigate("/lista"); // 🔹 Redirige después de autenticarse
    } catch (error) {
      setError("Error con Google");
      console.error("Error authenticating with Google:", error);
    }
  };

  //Inicio de sesión con Facebook
  const handleFacebookSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("User authenticated with Facebook:", result.user);
      navigate("/lista"); // 🔹 Redirige después de autenticarse
    } catch (error) {
      setError("Error con Facebook");
      console.error("Error authenticating with Facebook:", error);
    }
  };

  //Inicio de sesión con GitHub
  const handleGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      console.log("User authenticated with GitHub:", result.user);
      navigate("/lista"); // 🔹 Redirige después de autenticarse
    } catch (error) {
      setError("Error con GitHub");
      console.error("Error authenticating with GitHub:", error);
    }
  };

  return (
    <form className="form-inicioSesion" onSubmit={handleSubmit(onSubmit)}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <label htmlFor="email">Email</label>
      <input type="email" {...register("email")} required />

      <label htmlFor="password">Password</label>
      <input type="password" {...register("password")} required />

      <button type="submit">Iniciar sesión</button>

      <div className="button-container">
        <p>O inicia sesión con:</p>
        <button type="button" onClick={handleGoogleSignIn}>Google</button>
        <button type="button" onClick={handleFacebookSignIn}>Facebook</button>
        <button type="button" onClick={handleGithub}>GitHub</button>
      </div>
    </form>
  );
}

export default InicioSesion;
