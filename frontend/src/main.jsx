import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Self-hosted variable fonts — no CDN dependency at runtime.
// Fraunces uses `full.css` rather than the default entry so the SOFT and
// WONK axes are available, not just wght/opsz.
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import StartCase from './pages/StartCase.jsx'
import CaseDashboard from './pages/CaseDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App is the layout; these render into its outlet. */}
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="start" element={<StartCase />} />
          <Route path="case/:caseId" element={<CaseDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
