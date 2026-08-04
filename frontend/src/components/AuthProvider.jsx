import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../lib/auth'
import { fetchMe, getToken, login as apiLogin, setToken, signup as apiSignup } from '../lib/api'

/**
 * Holds the session for the whole app.
 *
 * The token is the credential and lives in localStorage (see lib/api.js); the
 * user object cached beside it exists only so the first paint after a reload
 * knows who is signed in without waiting on a request. That cached copy is
 * checked against the server on mount — a stale user with a dead token would
 * otherwise render a signed-in interface that fails on its first call.
 */

const USER_KEY = 'argus-user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // Storage unavailable — the session just will not survive a reload.
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  // Separates "not signed in" from "not checked yet", so a route guard does
  // not bounce a signed-in user to the login page on first paint.
  const [checking, setChecking] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return undefined

    const controller = new AbortController()

    fetchMe({ signal: controller.signal })
      .then(({ user: fresh }) => {
        storeUser(fresh)
        setUser(fresh)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        // Expired, revoked, or signed with a secret the server no longer has.
        setToken(null)
        storeUser(null)
        setUser(null)
      })
      .finally(() => setChecking(false))

    return () => controller.abort()
  }, [])

  const adopt = useCallback(({ token, user: next }) => {
    setToken(token)
    storeUser(next)
    setUser(next)
    return next
  }, [])

  const signIn = useCallback(async (credentials) => adopt(await apiLogin(credentials)), [adopt])
  const signUp = useCallback(async (details) => adopt(await apiSignup(details)), [adopt])

  const signOut = useCallback(() => {
    setToken(null)
    storeUser(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, checking, signIn, signUp, signOut }),
    [user, checking, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
