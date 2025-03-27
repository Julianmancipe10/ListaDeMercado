// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider,GithubAuthProvider,FacebookAuthProvider } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-tbdFln7tixDl-0rkFm9QeCLndcp0GRg",
  authDomain: "react-hook-form-1774b.firebaseapp.com",
  projectId: "react-hook-form-1774b",
  storageBucket: "react-hook-form-1774b.appspot.com",  // 🔹 Corregido el dominio
  messagingSenderId: "812717398372",
  appId: "1:812717398372:web:56317bc4246775aa260271",
  measurementId: "G-39PME51VWQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider= new GithubAuthProvider();
const facebookProvider=new FacebookAuthProvider();
export const db = getFirestore();


export { auth, googleProvider,githubProvider,facebookProvider };
