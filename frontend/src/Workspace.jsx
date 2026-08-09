import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import StarsBackground from './components/StarsBackground'
import ThemeToggle from './components/ThemeToggle'
import Sidebar from './components/Sidebar'
import './Workspace.css'

/**
 * Layout for the signed-in half of the product — the case list, a case, and
 * the upload screen.
 *
 * App.jsx is still the layout for everything public. The split is why this
 * exists at all: a marketing page wants a centred topbar and a footer full of
 * links onward, and a workspace wants neither. Trying to serve both from one
 * layout is what produced a topbar carrying a section nav, a sign-in button,
 * an account chip and a call to action all at once.
 *
 * The star field stays, and so does the glass, so crossing between the two
 * does not feel like crossing between two products. The footer does not: it
 * is marketing navigation, and there is nowhere onward from here.
 *
 * Access is guarded on the route, not in here — see main.jsx. This renders
 * only for someone signed in, which is what lets the sidebar read the account
 * without checking whether there is one.
 */
export default function Workspace() {
  const { pathname } = useLocation()

  // Same reason as App.jsx: BrowserRouter leaves the scroll position where it
  // was, so arriving at a case from halfway down the case list lands you
  // halfway down the case. No hash exemption — nothing in here is anchored.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <StarsBackground />

      <Sidebar />

      {/* Outside the rail rather than in it: the rail is navigation, and the
          theme control belongs to the page. */}
      <div className="workspace__tools">
        <ThemeToggle />
      </div>

      <main className="workspace__main" id="main">
        <Outlet />
      </main>
    </>
  )
}
