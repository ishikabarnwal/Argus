import { Link, NavLink, useMatch, useNavigate } from 'react-router-dom'
import { IconLayers, IconPlus, IconSignOut } from './Icons'
import { useAuth } from '../lib/auth'
import './Sidebar.css'

/**
 * Navigation for the signed-in workspace, in place of the marketing topbar.
 *
 * The topbar is a capsule floating over a landing page; this is the chrome of
 * an application someone is working in, so it is a rail rather than a bar —
 * but it is the same glass over the same star field, so moving between the
 * two does not feel like moving between two products.
 *
 * Below 900px it collapses to icons. The labels stay in the DOM and are
 * hidden the way .sr-only hides things rather than with display:none: an
 * icon-only link whose text is removed has no accessible name at all, and
 * every item here would announce as "link".
 */
export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // useMatch rather than useParams: this component renders in the layout
  // route, above the route that owns :caseId, so the param is not in scope
  // here. useMatch asks the URL directly and works at any depth.
  const caseMatch = useMatch('/case/:caseId')
  const openCaseId = caseMatch?.params.caseId

  const isInvestigator = user?.role === 'investigator'

  function handleSignOut() {
    signOut()
    // Out to the public page rather than letting the route guard bounce them
    // off a workspace screen a moment later.
    navigate('/', { replace: true })
  }

  return (
    <aside className="sidebar">
      <Link className="sidebar__brand" to="/">
        <span className="sidebar__mark" aria-hidden="true" />
        <span className="sidebar__label sidebar__brandname">Argus</span>
      </Link>

      <nav className="sidebar__nav" aria-label="Workspace">
        <NavLink className="sidebar__link" to="/cases">
          <IconLayers />
          <span className="sidebar__label">{isInvestigator ? 'All cases' : 'My cases'}</span>
        </NavLink>

        {/* The case being read, listed under the case list it belongs to.
            Without it the rail says "My cases" while you are looking at one
            of them, and nothing on the screen says which. */}
        {openCaseId && (
          <NavLink
            className="sidebar__link sidebar__link--case"
            to={`/case/${encodeURIComponent(openCaseId)}`}
          >
            <span className="sidebar__branch" aria-hidden="true" />
            <span className="sidebar__label sidebar__caseid">{openCaseId}</span>
          </NavLink>
        )}

        {/* Investigators are read-only, so the one action they cannot take is
            not offered to them. The API refuses it independently. */}
        {!isInvestigator && (
          <NavLink className="sidebar__link" to="/start">
            <IconPlus />
            <span className="sidebar__label">Start a case</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar__account">
        {/* Survives the collapse to icons, so the rail still answers "who am
            I signed in as" when there is no room for the address. */}
        <span className="sidebar__avatar" aria-hidden="true">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </span>

        <span className="sidebar__label sidebar__who">
          <span className="sidebar__email">{user?.email}</span>
          <span className="sidebar__role label-caps">
            {isInvestigator ? 'Investigator' : 'Victim'}
          </span>
        </span>

        <button className="sidebar__signout" type="button" onClick={handleSignOut}>
          <IconSignOut />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
