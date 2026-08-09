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
import Workspace from './Workspace.jsx'
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
          {/* Public: topbar and footer, for anyone at all. */}
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />

            {/* Unguarded, and in the public layout on purpose. Vercel
                rewrites unmatched paths to index.html so refreshes work, so
                this is what actually tells someone the address is wrong —
                and being told that should not require signing in first, or
                arrive wrapped in a workspace they may have no account for. */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* The signed-in workspace: a sidebar instead of a topbar.
              Guarded once, around the layout rather than around each screen,
              so the sidebar never renders before there is an account for it
              to show. */}
          <Route
            element={
              <RequireAuth>
                <Workspace />
              </RequireAuth>
            }
          >
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
            <Route path="cases" element={<CasesList />} />
            <Route path="case/:caseId" element={<CaseDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
