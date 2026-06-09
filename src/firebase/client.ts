// Phase 7B — Fail-soft Firebase client (Auth only).
//
// Reads config from Vite env vars and initializes Firebase Auth ONLY. If the env
// is missing/incomplete or initialization throws (e.g. Firebase unreachable from
// Iran without VPN), this module degrades to "not configured" and NEVER throws at
// import time — the app must keep working as a guest. Firestore is intentionally
// NOT initialized in this phase.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const env = import.meta.env

const config = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,     // optional
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, // optional
}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** True only when all four required Firebase vars are present and non-empty. */
export const isFirebaseConfigured: boolean =
  nonEmpty(config.apiKey) &&
  nonEmpty(config.authDomain) &&
  nonEmpty(config.projectId) &&
  nonEmpty(config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
      ...(nonEmpty(config.storageBucket) ? { storageBucket: config.storageBucket } : {}),
      ...(nonEmpty(config.messagingSenderId) ? { messagingSenderId: config.messagingSenderId } : {}),
    })
    auth = getAuth(app)
    // Default persistence is browserLocalPersistence (session survives reload).
  } catch {
    // Init failed — degrade to unconfigured; the app stays usable as a guest.
    app = null
    auth = null
  }
}

/** The Auth instance, or null when Firebase is unavailable/unconfigured. */
export function getAuthInstance(): Auth | null {
  return auth
}
