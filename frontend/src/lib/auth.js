import { createContext, useContext } from 'react'

/**
 * Session context and its accessor.
 *
 * Deliberately separate from the provider that fills it. Fast refresh only
 * works on a module that exports components and nothing else, so the provider
 * lives in components/AuthProvider.jsx and this file — which every consumer
 * imports for the hook — stays component-free.
 */

export const AuthContext = createContext(null)

/** @returns {{ user, checking, signIn, signUp, signOut }} */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
