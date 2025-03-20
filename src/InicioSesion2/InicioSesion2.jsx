import React from "react";
import { useForm } from "react-hook-form";
import { signInWithPopup } from "firebase/auth";
import { auth,googleProvider } from "../firebase/firebaseConfig";
import "./InicioSesion2.css";

function InicioSesion2() {
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
      const githubProvider = new GithubAuthProvider(); 
      const result = await signInWithPopup(auth, githubProvider);
      console.log("User authenticated with GitHub:", result.user);
    } catch (error) {
      console.error("Error authenticating with GitHub:", error.message);
    }
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="name">Name</label>
      <input type="text" {...register("name")} required />

      <label htmlFor="email">Email</label>
      <input type="email" {...register("email")} required />

      <label htmlFor="password">Password</label>
      <input type="password" {...register("password")} required />

      <label htmlFor="confirmPassword">Confirm Password</label>
      <input type="password" {...register("confirmPassword")} required />

      <label htmlFor="birthdate">Birthdate</label>
      <input type="date" {...register("birthdate")} required />

      <label htmlFor="country">Country</label>
      <select {...register("country")} required>
        <option value="mx">Mexico</option>
        <option value="co">Colombia</option>
        <option value="ar">Argentina</option>
      </select>

      <label htmlFor="file">Profile Picture</label>
      <input type="file" {...register("file")} required />

      <label htmlFor="terms">Accept Terms</label>
      <input type="checkbox" {...register("terms")} required />

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
export default InicioSesion2;