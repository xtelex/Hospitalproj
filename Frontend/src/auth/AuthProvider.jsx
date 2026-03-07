import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, firebaseConfigError, firebaseConfigured, firebaseInitError, googleProvider } from './firebase'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      if (firebaseConfigError) console.warn(firebaseConfigError)
      if (firebaseInitError) console.warn(firebaseInitError)
      setUser(null)
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Firebase is not configured.')
    }

    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  const signUpWithEmailPassword = async ({ email, password, displayName }) => {
    if (!firebaseConfigured || !auth) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Firebase is not configured.')
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }

    return cred.user
  }

  const signInWithEmailPassword = async ({ email, password }) => {
    if (!firebaseConfigured || !auth) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Firebase is not configured.')
    }

    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  const sendPasswordReset = async ({ email }) => {
    if (!firebaseConfigured || !auth) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Firebase is not configured.')
    }
    await sendPasswordResetEmail(auth, email)
  }

  const signOutUser = async () => {
    if (!auth) return
    await signOut(auth)
  }

  const deleteCurrentUser = async () => {
    if (!firebaseConfigured || !auth || !auth.currentUser) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Not signed in.')
    }
    await deleteUser(auth.currentUser)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signUpWithEmailPassword,
      signInWithEmailPassword,
      sendPasswordReset,
      deleteCurrentUser,
      signOutUser,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
