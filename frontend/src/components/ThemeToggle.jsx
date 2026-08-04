import { useTheme } from '../lib/useTheme'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
    >
      <span className="theme-toggle__dot" aria-hidden="true" />
      <span className="theme-toggle__label">{theme === 'dark' ? 'Noir' : 'Case file'}</span>
    </button>
  )
}
