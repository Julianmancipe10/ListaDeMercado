import React from "react";
import { useForm } from "react-hook-form";
import { signInWithPopup } from "firebase/auth";
import { auth,googleProvider,githubProvider,facebookProvider } from "../firebase/firebaseConfig";
import "./InicioSesion.css";

function InicioSesion() {
  const { register, handleSubmit, reset } = useForm(); 

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User authenticated with Google:", result.user);
    } catch (error) {
      console.error("Error authenticating with Google:", error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("User authenticated with Facebook:", result.user);
    } catch (error) {
      console.error("Error authenticating with Facebook:", error);
    }
  };

  const handleGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      console.log("User authenticated with GitHub:", result.user);
    } catch (error) {
      console.error("Error authenticating with GitHub:", error);
    }
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    reset();
  };

  return (
    

    
    <form  className="form-inicioSesion" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="name">Name</label>
      <input type="text" {...register("name")} required />

      <label htmlFor="email">Email</label>
      <input type="email" {...register("email")} required />
      <label htmlFor="password">Password</label>
      <input type="password" {...register("password")} required />


      <button type="submit">Submit</button>

      <div className="button-container">
        <p>Or sign in with:</p>
        <button type="button" onClick={handleGoogleSignIn}>Google</button>
        <button type="button" onClick={handleFacebookSignIn}>Facebook</button>
        <button type="button" onClick={handleGithub}>GitHub</button>

      </div>
    </form>
  );
}
export default InicioSesion;