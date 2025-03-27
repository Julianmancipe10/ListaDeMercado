import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { useNavigate } from "react-router-dom";
import "./InicioSesion2.css";

function InicioSesion2() {
  const { register, handleSubmit, reset, watch } = useForm(); 
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate=useNavigate();


  // Registrar usuario con Email y Contraseña
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
        navigate("/lista"); // 🔹 Redirigir después de registrar y actualizar perfil
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            setError("El correo ya está registrado. Inicia sesión o usa otro email.");
        } else {
            setError("Error al registrar usuario: " + error.message);
        }
        console.error("Error:", error);    
    }
};



  //Autenticación con Google
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Usuario autenticado con Google:", result.user);
      navigate("/lista"); // de registrar el usuario
    } catch (error) {
      setError(error.message);
      console.error("Error autenticando con Google:", error);
    }
  };

  // 🔹 Autenticación con Facebook
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

  //Autenticación con GitHub
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
    <div>
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="name">Nombre</label>
        <input type="text" {...register("name")} required />

        <label htmlFor="email">Email</label>
        <input type="email" {...register("email")} required />

        <label htmlFor="password">Contraseña</label>
        <input type="password" {...register("password")} required />

        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input type="password" {...register("confirmPassword")} required />

        <label htmlFor="birthdate">Fecha de Nacimiento</label>
        <input type="date" {...register("birthdate")} required />

        <label htmlFor="country">País</label>
        <select {...register("country")} required>
          <option value="mx">México</option>
          <option value="co">Colombia</option>
          <option value="ar">Argentina</option>
        </select>

        <label htmlFor="file">Foto de Perfil</label>
        <input type="file" {...register("file")} accept="image/*" />

        <label htmlFor="terms">
          <input type="checkbox" {...register("terms")} required />
          Acepto los términos y condiciones
        </label>

        <button type="submit">Registrarse</button>

        <div className="button-container">
          <p>O inicia sesión con:</p>
          <button type="button" onClick={handleGoogleSignIn}>Google</button>
          <button type="button" onClick={handleFacebookSignIn}>Facebook</button>
          <button type="button" onClick={handleGithub}>GitHub</button>
        </div>
      </form>
    </div>
  );
}
export default InicioSesion2;
