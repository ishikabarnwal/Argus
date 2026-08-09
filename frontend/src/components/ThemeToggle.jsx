import { useTheme } from '../lib/useTheme'
import { IconMoon, IconSun } from './Icons'
import './ThemeToggle.css'

/**
 * Icon-only theme switch.
 *
 * The icon shows the theme the button switches TO, not the one you are in —
 * a control is labelled by what it does. In dark mode you see a sun, because
 * pressing it gets you daylight. The aria-label says the same thing in words,
 * so the two never disagree.
 *
 * It used to be a pill reading "Noir" / "Case file", which named the current
 * theme rather than the destination and needed the reader to know the product
 * had two modes called those things before it meant anything.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  )
}
