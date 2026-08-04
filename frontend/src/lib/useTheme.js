import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'argus-theme'

/**
 * Theme state, shared across every consumer.
 *
 * The `data-theme` attribute on <html> is the single source of truth — it is
 * already set before first paint by the inline script in index.html, and it is
 * what the CSS actually keys off. Consumers subscribe to it rather than each
 * holding their own copy.
 *
 * This used to be a plain `useState` inside the hook. That works for exactly
 * one consumer and breaks silently the moment there are two: each call site
 * gets an INDEPENDENT state, so toggling from the header updated the header's
 * copy and the DOM attribute (CSS followed, colours changed) while every other
 * consumer kept rendering its own stale value until a full refresh. The hero
 * shield stayed on the wrong image for exactly that reason.
 *
 * useSyncExternalStore removes the possibility rather than patching it: there
 * is no second copy to fall out of sync, and it stays correct no matter who
 * changes the attribute — this hook, the pre-paint script, or devtools.
 */

const root = () => document.documentElement

// Module-scoped so the references are stable; an inline function here would
// make useSyncExternalStore resubscribe on every render.
function subscribe(onStoreChange) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(root(), { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return root().getAttribute('data-theme') || 'dark'
}

/** Dark is the default identity, so it is also the pre-hydration answer. */
function getServerSnapshot() {
  return 'dark'
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  /** Takes a plain 'dark' | 'light' — not a setState updater. */
  const setTheme = useCallback((next) => {
    root().setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode / storage disabled — the attribute above still applies,
      // the choice just won't survive a reload.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
