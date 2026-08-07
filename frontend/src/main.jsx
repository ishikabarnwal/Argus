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
import RequireAuth from './components/RequireAuth.jsx'
import AuthProvider from './components/AuthProvider.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import StartCase from './pages/StartCase.jsx'
import CasesList from './pages/CasesList.jsx'
import CaseDashboard from './pages/CaseDashboard.jsx'
import NotFound from './pages/NotFound.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* App is the layout; these render into its outlet. */}
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />

            {/* Uploading is a 'user' action — investigators are read-only,
                which the API enforces independently. */}
            <Route
              path="start"
              element={
                <RequireAuth role="user">
                  <StartCase />
                </RequireAuth>
              }
            />
            <Route
              path="cases"
              element={
                <RequireAuth>
                  <CasesList />
                </RequireAuth>
              }
            />
            <Route
              path="case/:caseId"
              element={
                <RequireAuth>
                  <CaseDashboard />
                </RequireAuth>
              }
            />

            {/* Last, and unguarded. Vercel rewrites unmatched paths to
                index.html so refreshes work, so this is what actually tells
                someone the address is wrong — and being told that should not
                require signing in first. */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
