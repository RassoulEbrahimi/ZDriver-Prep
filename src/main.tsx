import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { installViewportHeight } from './viewportHeight'
import './index.css'

// Pin the app shell to the real visible viewport height before first paint, so a
// reload / pull-to-refresh / update activation can never leave the shell taller
// than the visible area (which clips bottom content and overlaps the nav).
installViewportHeight()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
