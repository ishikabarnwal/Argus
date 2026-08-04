import { useLocation } from 'react-router-dom'

/**
 * Links to the homepage's sections, which are anchors rather than routes.
 *
 * From the homepage a bare `#why` scrolls in place. From anywhere else the
 * link has to reach the homepage first, so it becomes `/#why` — and it stays
 * a plain <a>, i.e. a full page load, deliberately: React Router does not
 * scroll to a hash on a client-side navigation, so a <Link to="/#why"> would
 * land at the top of the homepage and simply ignore the anchor.
 */
export function useSectionHref() {
  const isHome = useLocation().pathname === '/'
  return (id) => (isHome ? `#${id}` : `/#${id}`)
}
