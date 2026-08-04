import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import StarsBackground from './components/StarsBackground'
import ThemeToggle from './components/ThemeToggle'
import TubelightNav from './components/TubelightNav'
import Footer from './components/Footer'
import { useAuth } from './lib/auth'
import './App.css'

/**
 * Layout shared by every route: the star field, the floating topbar, and the
 * footer. Routes render into the <main> through the outlet.
 */
function App() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  function handleSignOut() {
    signOut()
    // Away from anything that needed the session, rather than letting the
    // route guard bounce them to the login page a moment later.
    navigate('/', { replace: true })
  }

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

        <div className="topbar__actions">
          <ThemeToggle />

          {user ? (
            <>
              <Link className="account" to="/cases">
                <span className="account__email">{user.email}</span>
                <span className="account__role label-caps">
                  {user.role === 'investigator' ? 'Investigator' : 'Victim'}
                </span>
              </Link>
              <button className="btn btn--outline btn--sm" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="btn btn--outline btn--sm topbar__cta" to="/login">
              Sign in
            </Link>
          )}

          {/* Investigators are read-only, so the one action they cannot take
              is not offered to them. */}
          {user?.role !== 'investigator' && (
            <Link className="btn btn--primary btn--sm topbar__cta" to="/start">
              Start a case
            </Link>
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
