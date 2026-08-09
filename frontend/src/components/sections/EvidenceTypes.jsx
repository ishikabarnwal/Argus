import { motion, useReducedMotion } from 'framer-motion'
import Reveal from '../Reveal'
import { IconChat, IconImage, IconStatement } from '../Icons'
import './EvidenceTypes.css'

/**
 * The three evidence types the prototype actually supports, as floating glass
 * panels directly below the hero. Deliberately three and not "and more" — the
 * scope is real and the page should not promise past it.
 *
 * This used to be a plain card grid much further down the page. It was moved
 * and rebuilt rather than duplicated: a second copy below the hero would have
 * said the same three things twice on one page, which is the opposite of what
 * moving it was meant to fix. The #evidence anchor came with it, so the nav
 * still resolves.
 *
 * The orbs are not decoration. Glass needs something behind it worth blurring
 * — over a flat background, a backdrop-filter renders as a slightly different
 * flat background and the whole effect is wasted. The two blurred gradients
 * are what the panels are actually made of.
 *
 * Motion is split across two elements on purpose. The wrapper does the
 * one-shot scroll entrance; the panel inside it runs the endless float. One
 * element cannot do both, because the entrance and the float would be two
 * animations fighting over the same transform.
 */

const TYPES = [
  {
    id: 'whatsapp',
    icon: <IconChat />,
    title: 'WhatsApp export',
    body: 'Drop in a chat export. Argus reads the conversation, lifts out names, phone numbers, UPI IDs and amounts, and orders every message by timestamp.',
    tag: 'chat.txt',
  },
  {
    id: 'screenshot',
    icon: <IconImage />,
    title: 'Screenshot',
    body: 'Payment confirmations, profile pages, SMS. Tesseract reads the text off the image, then entity extraction keeps the parts that matter to a complaint.',
    tag: '.png / .jpg',
  },
  {
    id: 'statement',
    icon: <IconStatement />,
    title: 'Bank statement',
    body: 'Transactions, references and counterparties — checked against what the conversation claims happened, so the two can disagree in public.',
    tag: '.pdf / .csv',
  },
]

const EASE = [0.22, 1, 0.36, 1]

/* Different distances and periods per panel, none of them multiples of each
 * other. Matched timings would have the three rising and falling together,
 * which reads as one object on a hinge rather than three floating. */
const FLOATS = [
  { y: [0, -9, 0], duration: 7.3 },
  { y: [0, -14, 0], duration: 8.9 },
  { y: [0, -7, 0], duration: 6.4 },
]

const GROUP = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12 } },
}

const PANEL = {
  hidden: { opacity: 0, y: 26 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export default function EvidenceTypes() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="section glassband" id="evidence">
      <div className="glassband__orbs" aria-hidden="true">
        <motion.span
          className="glassband__orb glassband__orb--gold"
          animate={reducedMotion ? undefined : { x: [0, 30, 0], y: [0, -22, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="glassband__orb glassband__orb--blue"
          animate={reducedMotion ? undefined : { x: [0, -26, 0], y: [0, 18, 0] }}
          transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="section__inner">
        <Reveal className="section__head section__head--center">
          <p className="eyebrow label-caps">What you can upload</p>
          <h2 className="section__title">
            Three kinds of evidence. <em>One</em> case file.
          </h2>
          <p className="section__lede lead">
            Everything lands in the same case, on the same timeline, whether it started as a chat,
            a photo or a bank record.
          </p>
        </Reveal>

        <motion.div
          className="glassband__cards"
          variants={GROUP}
          initial={reducedMotion ? false : 'hidden'}
          whileInView="shown"
          viewport={{ once: true, margin: '-90px' }}
        >
          {TYPES.map((type, i) => (
            <motion.div className="gcard-slot" key={type.id} variants={PANEL}>
              <motion.article
                className="gcard"
                animate={reducedMotion ? undefined : { y: FLOATS[i].y }}
                transition={{ duration: FLOATS[i].duration, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="gcard__icon">{type.icon}</span>
                <h3 className="gcard__title">{type.title}</h3>
                <p className="gcard__body">{type.body}</p>
                <span className="gcard__tag">{type.tag}</span>
              </motion.article>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
