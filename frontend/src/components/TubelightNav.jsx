import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useSectionHref } from '../lib/sectionHref'
import './TubelightNav.css'

/**
 * Primary nav with a tubelight indicator. Adapted from
 * @ayushmxxn/components/tubelight-navbar (21st.dev).
 *
 * Two departures from the reference are worth knowing about:
 *
 *   1. It tracks scroll position, not clicks. The original seeds its active
 *      tab with `items[0]`, which on a one-page site means "Why Argus" is lit
 *      the moment you land — while you are still looking at the hero — and
 *      stays lit however far you scroll. Here the lamp follows the section
 *      actually on screen, and no section on screen means no lamp.
 *   2. There is one lamp, and hover borrows it. Lighting a second pill under
 *      the cursor would leave two claiming to be current; instead the lamp
 *      slides to whatever you are pointing at and returns to the real active
 *      section when you leave. Focus does the same, so a keyboard tab gets
 *      the identical feedback.
 */

const ITEMS = [
  { id: 'why', label: 'Why Argus' },
  { id: 'evidence', label: 'Evidence' },
]

const SECTION_IDS = ITEMS.map((item) => item.id)

// Enough travel to read as a light sliding along a rail, damped enough not to
// wobble when you sweep across the items quickly.
const LAMP_SPRING = { type: 'spring', stiffness: 320, damping: 32 }

/**
 * Which of `ids` is the section the reader is currently on.
 *
 * The observer's root margin collapses the viewport to a narrow band across
 * its middle, so "current" means "crossing the middle of the screen" rather
 * than "visible at all" — otherwise two adjacent sections are both onscreen
 * during a scroll and the answer flickers between them.
 */
function useActiveSection(ids, route) {
  const [active, setActive] = useState(null)

  // `route` is not read in the body — it is here so the observer is rebuilt
  // when the page changes under it. The sections only exist on the homepage,
  // so without it, navigating home from /start would leave the hook observing
  // the elements it failed to find on the other route.
  useEffect(() => {
    setActive(null)
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.find((entry) => entry.isIntersecting)
        const leaving = entries.filter((e) => !e.isIntersecting).map((e) => e.target.id)

        // Entering wins over leaving within a single batch: handling them in
        // arrival order can clear the section that just became current.
        setActive((current) => {
          if (entering) return entering.target.id
          return leaving.includes(current) ? null : current
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids, route])

  return active
}

export default function TubelightNav() {
  const reducedMotion = useReducedMotion()
  const { pathname } = useLocation()
  const sectionHref = useSectionHref()
  const active = useActiveSection(SECTION_IDS, pathname)
  const [pointed, setPointed] = useState(null)

  // Hover and focus only borrow the lamp; `active` remains the truth, and is
  // what gets announced.
  const lit = pointed ?? active

  return (
    <nav
      className="tubenav"
      aria-label="Primary"
      onMouseLeave={() => setPointed(null)}
    >
      {ITEMS.map((item) => (
        <a
          key={item.id}
          className="tubenav__item"
          href={sectionHref(item.id)}
          aria-current={active === item.id ? 'location' : undefined}
          onMouseEnter={() => setPointed(item.id)}
          onFocus={() => setPointed(item.id)}
          onBlur={() => setPointed(null)}
        >
          {lit === item.id && (
            <motion.span
              className="tubenav__lamp"
              layoutId="tubenav-lamp"
              initial={false}
              transition={reducedMotion ? { duration: 0 } : LAMP_SPRING}
            >
              {/* `layout` on the bar is not decoration. The lamp animates
                  between pills of different widths, which framer does with a
                  scale transform — without its own layout correction the bar
                  and its glow get stretched flat mid-flight. */}
              <motion.span className="tubenav__beam" layout />
            </motion.span>
          )}
          <span className="tubenav__label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
