// src/lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  type UserCredential
} from 'firebase/auth'
import { auth } from './config'

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  await sendEmailVerification(credential.user)
  return credential
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signOutUser = async (): Promise<void> => {
  return signOut(auth)
}

export const resendVerificationEmail = async (): Promise<void> => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser)
  }
}

export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email)
}

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser
}
