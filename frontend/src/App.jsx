import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import StarsBackground from './components/StarsBackground'
import ThemeToggle from './components/ThemeToggle'
import TubelightNav from './components/TubelightNav'
import Footer from './components/Footer'
import { useAuth } from './lib/auth'
import './App.css'

/**
 * Layout for the public pages: the star field, the floating topbar, and the
 * footer. Routes render into the <main> through the outlet.
 *
 * The signed-in screens use Workspace.jsx instead, which swaps the topbar for
 * a sidebar. Both keep the star field and the same glass, so crossing between
 * them does not feel like crossing between two products.
 */
function App() {
  const { pathname, hash } = useLocation()
  const { user } = useAuth()

  // BrowserRouter leaves the scroll position where it was, so arriving at
  // /start from halfway down the homepage lands you halfway down /start.
  // Anchors are exempt: a hash means the browser is being asked to scroll
  // somewhere specific, and undoing that immediately would defeat it.
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <StarsBackground />

      <header className="topbar">
        <Link className="topbar__brand" to="/">
          <span className="topbar__mark" aria-hidden="true" />
          Argus
        </Link>

        <TubelightNav />

        {/* Marketing chrome only. Identity, sign-out and the case list moved
            to the workspace sidebar when the signed-in half got its own
            layout — this bar was carrying a section nav, a sign-in button, an
            account chip and a call to action at the same time. What is left
            is the one thing a visitor needs: a way in. */}
        <div className="topbar__actions">
          <ThemeToggle />

          {user ? (
            <Link className="btn btn--primary btn--sm topbar__cta" to="/cases">
              Open workspace
            </Link>
          ) : (
            <>
              <Link className="btn btn--outline btn--sm topbar__cta" to="/login">
                Sign in
              </Link>
              <Link className="btn btn--primary btn--sm topbar__cta" to="/start">
                Start a case
              </Link>
            </>
          )}
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <Footer />
    </>
  )
}

export default App
