import { Link, useLocation } from 'react-router-dom'

/**
 * Whatever address did not match a route.
 *
 * Worth knowing that the server does not return a 404 for these. Vercel
 * rewrites every unmatched path to index.html so client-side routes survive a
 * refresh (see frontend/vercel.json), which means the app is what decides a
 * URL is wrong — the response status is always 200. This page is the 404.
 *
 * Note that a bad case ID does not land here: /case/:caseId matches whatever
 * is in that slot, and the dashboard reports a case it could not load. This
 * is only for addresses with no route at all.
 */
export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <section className="page">
      <div className="page__inner">
        <header className="page__head">
          <p className="eyebrow label-caps">404</p>
          <h1 className="section__title">There is nothing at this address.</h1>
          <p className="section__lede lead">
            No page matches <code>{pathname}</code>. It may be a mistyped address, or a link to
            something that no longer exists.
          </p>
        </header>

        <Link className="btn btn--primary" to="/">
          Back to the homepage
        </Link>
      </div>
    </section>
  )
}
