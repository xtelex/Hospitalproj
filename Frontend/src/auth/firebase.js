import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const env = import.meta.env

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingKeys = requiredKeys.filter((k) => !env?.[k])

export const firebaseConfigured = missingKeys.length === 0

const firebaseConfig = firebaseConfigured
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }
  : null

let app = null
let initError = ''

if (firebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (err) {
    initError = err?.message || 'Firebase initialization failed.'
  }
}

export const auth = app ? getAuth(app) : null
export const googleProvider = app ? new GoogleAuthProvider() : null

if (googleProvider) googleProvider.setCustomParameters({ prompt: 'select_account' })

export const firebaseConfigError = firebaseConfigured
  ? ''
  : `Firebase config missing: ${missingKeys.join(', ')}. Create Frontend/.env (see Frontend/.env.example).`

export const firebaseInitError = initError
