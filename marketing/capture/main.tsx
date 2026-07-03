// M6A-2 — Dev-only capture viewer entry.
//
// Mounts <CaptureViewer/> and reuses the app stylesheet so the real QuestionCard
// renders with identical fonts, colors, and CSS variables. Intentionally does NOT
// import App, AuthProvider, or installViewportHeight — this viewer touches no
// production providers, navigation, or app state.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { CaptureViewer } from './CaptureViewer'
import '../../src/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureViewer />
  </React.StrictMode>,
)
