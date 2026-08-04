import { useEffect, useMemo } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

/**
 * Drifting star field behind the whole page. Ported from
 * @bundui/components/stars (21st.dev) — same technique, adapted to this
 * codebase.
 *
 * Mounted once at the root and fixed to the viewport, so it does not scroll
 * with the content: the page slides over a stationary field rather than
 * dragging it along.
 *
 * Every star in a layer is one entry in a single element's box-shadow, so a
 * few hundred stars cost three DOM nodes rather than three hundred, and the
 * whole layer animates as one transform.
 *
 * Two changes from the original are load-bearing:
 *
 *   1. Colour is omitted from each shadow entry, so it resolves to
 *      `currentColor` and is set in CSS from `--star` / `--star-accent`.
 *      The original took a `starColor` string and regenerated every shadow
 *      when it changed, which on a theme toggle means rebuilding a
 *      several-thousand-character string per layer. Here the toggle is a
 *      plain CSS colour change like everything else on the page.
 *   2. Horizontal positions are in `vw`, not px. The original scattered
 *      stars across a fixed ±2000px box, which leaves a bare strip on wide
 *      screens; a viewport unit covers any width without measuring.
 */

/** Height of one vertical tile. Each layer holds two copies stacked exactly
 *  this far apart and scrolls by exactly this much, so the loop is seamless. */
const TILE_H = 2000

/* Deliberately sparse and slow — this sits under every section on the page,
 * so it should register as texture and never pull the eye. The source
 * component's defaults (1000/400/200 stars, 50s) are roughly three times this
 * density and twice the speed. */
const LAYERS = [
  { count: 300, size: 1, duration: 90, tone: 'base' },
  { count: 120, size: 1.5, duration: 150, tone: 'base' },
  { count: 40, size: 2, duration: 210, tone: 'accent' },
]

/** Mouse parallax strength. The original's 0.05 is a lot of travel for a
 *  backdrop; this is enough to feel like depth, not enough to notice. */
const PARALLAX = 0.015
const SPRING = { stiffness: 50, damping: 20 }

function generateShadows(count) {
  const shadows = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = Math.floor(Math.random() * TILE_H)
    // No colour term — the shadow inherits currentColor from the layer.
    shadows.push(`${x}vw ${y}px`)
  }
  return shadows.join(', ')
}

function StarLayer({ count, size, duration, tone, animate }) {
  // Positions are fixed for the life of the mount. Re-rolling them on a
  // re-render would make the field visibly jump.
  const shadows = useMemo(() => generateShadows(count), [count])

  const dot = { width: `${size}px`, height: `${size}px`, boxShadow: shadows }

  return (
    <motion.div
      className={`stars__layer stars__layer--${tone}`}
      style={{ height: TILE_H }}
      animate={animate ? { y: [0, -TILE_H] } : undefined}
      transition={animate ? { repeat: Infinity, duration, ease: 'linear' } : undefined}
    >
      <div className="stars__dot" style={dot} />
      <div className="stars__dot" style={{ ...dot, top: TILE_H }} />
    </motion.div>
  )
}

export default function StarsBackground() {
  const reducedMotion = useReducedMotion()

  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const x = useSpring(offsetX, SPRING)
  const y = useSpring(offsetY, SPRING)

  // Listening on the window rather than the element: the field is
  // pointer-events: none (it must never swallow a click anywhere on the
  // page), so it cannot receive mouse events of its own.
  useEffect(() => {
    if (reducedMotion) return

    const onMove = (event) => {
      offsetX.set(-(event.clientX - window.innerWidth / 2) * PARALLAX)
      offsetY.set(-(event.clientY - window.innerHeight / 2) * PARALLAX)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [offsetX, offsetY, reducedMotion])

  return (
    <div className="stars" aria-hidden="true">
      {/* Reduced motion keeps the field — it is texture, and a still star
          field is a perfectly good one — but drops the drift and the
          parallax. */}
      <motion.div style={reducedMotion ? undefined : { x, y }}>
        {LAYERS.map((layer) => (
          <StarLayer key={layer.size} {...layer} animate={!reducedMotion} />
        ))}
      </motion.div>
    </div>
  )
}
