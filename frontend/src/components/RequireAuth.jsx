import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/**
 * Route guard. Wraps a route element; sends anyone without a session to the
 * login page, remembering where they were headed so they land there after
 * signing in.
 *
 * `role` narrows it further — investigators are read-only, so the upload route
 * is a 'user' route. They are redirected to their case list rather than to
 * login, since the problem is what their account may do, not who they are.
 *
 * This is convenience, not security. Every rule here is enforced again by the
 * API, which is the only place it counts; the guard exists so people are not
 * shown a screen that is going to fail.
 */
export default function RequireAuth({ children, role }) {
  const { user, checking } = useAuth()
  const location = useLocation()

  // A stored token is still being validated. Redirecting now would throw a
  // signed-in user out on every refresh.
  if (checking) return null

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role && user.role !== role) return <Navigate to="/cases" replace />

  return children
}
