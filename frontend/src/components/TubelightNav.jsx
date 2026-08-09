import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
 *
 * An item is either a homepage section (`id`, scrolled to) or a route
 * (`path`, navigated to). They light by different means — a section by
 * scroll position, a route by the address — but only ever one at a time,
 * because a route item is on a page that has no sections to observe.
 */

const ITEMS = [
  { id: 'why', label: 'Why Argus' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'learn', label: 'How fraud works', path: '/learn' },
]

const SECTION_IDS = ITEMS.filter((item) => !item.path).map((item) => item.id)

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
  const section = useActiveSection(SECTION_IDS, pathname)
  const [pointed, setPointed] = useState(null)

  // A route item on its own page outranks the scroll position, which on that
  // page has no sections to report anyway.
  const route = ITEMS.find((item) => item.path === pathname)
  const active = route ? route.id : section

  // Hover and focus only borrow the lamp; `active` remains the truth, and is
  // what gets announced.
  const lit = pointed ?? active

  return (
    <nav
      className="tubenav"
      aria-label="Primary"
      onMouseLeave={() => setPointed(null)}
    >
      {ITEMS.map((item) => {
        // A route is a client-side navigation; a section is an anchor, and
        // has to stay one — see useSectionHref for why.
        const Tag = item.path ? Link : 'a'
        const target = item.path ? { to: item.path } : { href: sectionHref(item.id) }

        return (
          <Tag
            key={item.id}
            className="tubenav__item"
            {...target}
            aria-current={active === item.id ? (item.path ? 'page' : 'location') : undefined}
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
          </Tag>
        )
      })}
    </nav>
  )
}
