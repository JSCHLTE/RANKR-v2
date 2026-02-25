import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    type User,
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  const googleProvider = new GoogleAuthProvider();
  
  export async function signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }
  
  export async function signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }
  
  export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
  
  export async function logOut() {
    await signOut(auth);
  }
  
  export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }