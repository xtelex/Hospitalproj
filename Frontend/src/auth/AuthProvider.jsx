import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, firebaseConfigError, firebaseConfigured, firebaseInitError, googleProvider } from './firebase'
import { setDoctorIdForUser, setRoleForUser } from '../data/appointmentsStore'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const PENDING_ROLE_KEY = 'auth:pendingRole'
const PENDING_DOCTOR_ID_KEY = 'auth:pendingDoctorId'

function preferRedirectSignIn() {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches
  const small = window.matchMedia?.('(max-width: 768px)')?.matches
  const ua = navigator?.userAgent || ''
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  return !!(coarse || small || mobileUa)
}

function persistPendingAuthContext({ role, doctorId }) {
  try {
    if (role) localStorage.setItem(PENDING_ROLE_KEY, role === 'doctor' ? 'doctor' : 'patient')
    if (doctorId !== undefined) localStorage.setItem(PENDING_DOCTOR_ID_KEY, String(doctorId || '').trim())
  } catch {
    // ignore storage failures
  }
}

function consumePendingAuthContext() {
  try {
    const role = localStorage.getItem(PENDING_ROLE_KEY) || ''
    const doctorId = localStorage.getItem(PENDING_DOCTOR_ID_KEY) || ''
    localStorage.removeItem(PENDING_ROLE_KEY)
    localStorage.removeItem(PENDING_DOCTOR_ID_KEY)
    return { role, doctorId }
  } catch {
    return { role: '', doctorId: '' }
  }
}

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

    // If Google sign-in used redirect (common on mobile), resolve the result once on load.
    // Auth state will still be handled by onAuthStateChanged, but this helps surface redirect errors.
    getRedirectResult(auth).catch((e) => {
      // Most redirect errors are configuration-related (authorized domain / OAuth consent screen).
      console.warn(e?.message || e)
    })

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)

      if (nextUser?.uid) {
        const pending = consumePendingAuthContext()
        if (pending.role) setRoleForUser(nextUser.uid, pending.role)
        if (pending.role) {
          if (pending.role === 'doctor') setDoctorIdForUser(nextUser.uid, pending.doctorId)
          else setDoctorIdForUser(nextUser.uid, '')
        }
      }
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async ({ role, doctorId } = {}) => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      throw new Error(firebaseConfigError || firebaseInitError || 'Firebase is not configured.')
    }

    persistPendingAuthContext({ role, doctorId })

    // Popups are commonly blocked on mobile (and inside in-app browsers), so prefer redirect there.
    if (preferRedirectSignIn()) {
      await signInWithRedirect(auth, googleProvider)
      return null
    }

    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (e) {
      const code = String(e?.code || '')
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
        return null
      }
      throw e
    }
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
