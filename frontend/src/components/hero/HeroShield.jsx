import { useTheme } from '../../lib/useTheme'
import shieldDark from '../../assets/hero-shield-dark.png'
import shieldLight from '../../assets/hero-shield-light.png'

/**
 * Hero graphic. Two pre-rendered images, one per theme.
 *
 * Both are rendered and cross-faded by opacity rather than swapping a single
 * `src`. Swapping the source would show a blank frame while the new file
 * decodes on the first toggle, which is exactly the moment the transition is
 * meant to smooth over. Stacking them costs one extra decode up front and
 * makes the toggle instant thereafter.
 */
export default function HeroShield() {
  const { theme } = useTheme()
  const isDark = theme !== 'light'

  return (
    <div className="heroshield">
      <img
        className="heroshield__img"
        src={shieldDark}
        alt=""
        aria-hidden="true"
        style={{ opacity: isDark ? 1 : 0 }}
      />
      <img
        className="heroshield__img"
        src={shieldLight}
        alt=""
        aria-hidden="true"
        style={{ opacity: isDark ? 0 : 1 }}
      />
      {/* The pair is decorative — one alt text on a wrapper, not two competing
          descriptions read out in sequence. */}
      <span className="sr-only">
        A shield emblem over a circuit-board field, representing evidence held securely.
      </span>
    </div>
  )
}
