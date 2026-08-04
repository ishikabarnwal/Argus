import { motion, useReducedMotion } from 'framer-motion'

/**
 * Scroll-triggered reveal for everything below the hero.
 *
 * Direction is not decoration: it mirrors the product's own logic. Evidence
 * and input enter from the left, output and reports from the right, so the
 * page moves the way the pipeline does.
 *
 * Fires once. A section that re-animates every time it scrolls back into view
 * stops being an entrance and starts being a distraction.
 */

const OFFSETS = {
  up: { y: 26 },
  left: { x: -30 },
  right: { x: 30 },
}

// Standard ease-out-quint. Scroll-triggered entrances are not scrubbed, so a
// tween is right here; springs are reserved for direct interaction.
const EASE = [0.22, 1, 0.36, 1]

export default function Reveal({
  children,
  from = 'up',
  delay = 0,
  className,
  as: Tag = 'div',
}) {
  const reducedMotion = useReducedMotion()
  const MotionTag = motion[Tag] ?? motion.div

  if (reducedMotion) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...OFFSETS[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}
