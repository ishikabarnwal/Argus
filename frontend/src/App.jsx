import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import StarsBackground from './components/StarsBackground'
import ThemeToggle from './components/ThemeToggle'
import TubelightNav from './components/TubelightNav'
import Footer from './components/Footer'
import './App.css'

/**
 * Layout shared by every route: the star field, the floating topbar, and the
 * footer. Routes render into the <main> through the outlet.
 */
function App() {
  const { pathname, hash } = useLocation()

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
          <Link className="btn btn--primary btn--sm topbar__cta" to="/start">
            Start a case
          </Link>
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
