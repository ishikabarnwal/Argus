import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Reveal from '../Reveal'
import { IconAction, IconLayers, IconSpark, IconStatement } from '../Icons'
import './Pipeline.css'

/**
 * The route a piece of evidence takes, as a diagram you can interrogate
 * rather than a fourth grid of cards.
 *
 * Two kinds of motion, doing different jobs:
 *
 *   1. Scroll-triggered, once. The connector draws itself from the first node
 *      to the last and the stages arrive behind it in order. The point is the
 *      direction — this is a pipeline, and the page should say so before any
 *      of the words are read.
 *   2. Interaction-driven, repeatable. The gold ring is a single shared
 *      element that slides between stages on `layoutId`, the same trick the
 *      tubelight nav uses, so there is never a moment with two rings claiming
 *      to be current.
 *
 * It is a real tablist, not four buttons that look like one: roving tabindex,
 * arrow keys in both axes (the rail is horizontal on a wide screen and
 * vertical on a narrow one, and a keyboard user should not have to know
 * which), plus Home and End.
 *
 * Every stage describes something that exists. Tesseract, Gemini, the rule
 * scoring in backend/lib/riskScore.js, the PDF and the ZIP are all built and
 * reachable. Do not add a fifth stage for something on a roadmap.
 */

const EASE = [0.22, 1, 0.36, 1]

const STAGES = [
  {
    id: 'upload',
    icon: <IconLayers />,
    title: 'Upload',
    detail:
      'A WhatsApp chat export, a screenshot, or a bank statement — three types, and nothing pretends otherwise. Everything you add joins the same case ID, so a conversation from Tuesday and a statement from Friday end up in one file. The original is kept, not just the text read out of it.',
    tag: '.txt · .png / .jpg · .pdf / .csv',
  },
  {
    id: 'extract',
    icon: <IconSpark />,
    title: 'Read and extract',
    detail:
      'Screenshots go through Tesseract OCR, PDFs give up their existing text layer, chat exports are already text. Gemini then pulls the parts a complaint needs out of that text — names, phone numbers, UPI IDs, bank accounts, amounts, dates, and the urgency language sitting around them.',
    tag: 'Tesseract · Gemini',
  },
  {
    id: 'score',
    icon: <IconAction />,
    title: 'Score and flag gaps',
    detail:
      'Urgency phrases, the size of a transfer, and a contact number sitting beside a payment handle each add points, recomputed across the whole case on every upload. The rules are plain and live in one file rather than in a model, so the number can be explained to the person it is about. What the case is still missing is worked out at the same time.',
    tag: '0–100',
  },
  {
    id: 'report',
    icon: <IconStatement />,
    title: 'Report',
    detail:
      'The timeline, the relationship graph, the score and the gaps, in one PDF you can take to a complaint — or a ZIP of that report plus every original file, so the evidence travels with the summary rather than being described by it.',
    tag: 'PDF · ZIP',
  },
]

/* The rail hands its children in one at a time, behind the connector rather
 * than with it: the line should reach a node slightly before the node exists. */
const RAIL = {
  hidden: {},
  shown: { transition: { delayChildren: 0.3, staggerChildren: 0.13 } },
}

const NODE = {
  hidden: { opacity: 0, y: 16, scale: 0.9 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
}

const RING_SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function Pipeline() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(STAGES[0].id)
  const tabs = useRef([])

  const index = STAGES.findIndex((stage) => stage.id === active)
  const stage = STAGES[index]

  /** Arrow keys move focus and selection together — these tabs have no
   *  loading cost, so automatic activation is the right pattern. */
  function onKeyDown(event) {
    const last = STAGES.length - 1
    let next = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last

    if (next === null) return
    event.preventDefault()
    setActive(STAGES[next].id)
    tabs.current[next]?.focus()
  }

  // With reduced motion the connector is simply already drawn: the CSS
  // fallback for --draw is 1, so leaving the props off is the finished state.
  const draw = reducedMotion
    ? {}
    : {
        initial: { '--draw': 0 },
        whileInView: { '--draw': 1 },
        viewport: { once: true, margin: '-120px' },
        transition: { duration: 1, ease: EASE, delay: 0.15 },
      }

  return (
    <section className="section pipeline" id="how">
      <div className="section__inner">
        <Reveal className="section__head section__head--center">
          <p className="eyebrow label-caps">How it works</p>
          <h2 className="section__title">
            Four steps, one <em>case file</em>.
          </h2>
          <p className="section__lede lead">
            The same route every time, whatever you upload. Pick a step to see what happens inside
            it.
          </p>
        </Reveal>

        <div className="pipeline__rail">
          <span className="pipeline__track" aria-hidden="true">
            <motion.span className="pipeline__track-fill" {...draw} />
          </span>

          <motion.div
            className="pipeline__stages"
            role="tablist"
            aria-label="How Argus processes evidence"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            variants={RAIL}
            initial={reducedMotion ? false : 'hidden'}
            whileInView="shown"
            viewport={{ once: true, margin: '-120px' }}
          >
            {STAGES.map((item, i) => {
              const on = item.id === active

              return (
                <motion.button
                  key={item.id}
                  ref={(el) => {
                    tabs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`pipeline-tab-${item.id}`}
                  aria-controls="pipeline-panel"
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  className={`pstage${on ? ' pstage--on' : ''}`}
                  variants={NODE}
                  onClick={() => setActive(item.id)}
                >
                  <span className="pstage__node">
                    {on && (
                      <motion.span
                        className="pstage__ring"
                        layoutId="pipeline-ring"
                        initial={false}
                        transition={reducedMotion ? { duration: 0 } : RING_SPRING}
                      />
                    )}
                    <span className="pstage__icon">{item.icon}</span>
                    {/* The panel already announces "Step 2 of 4"; this is the
                        same fact drawn rather than said. */}
                    <span className="pstage__step tnum" aria-hidden="true">
                      {i + 1}
                    </span>
                  </span>
                  <span className="pstage__title">{item.title}</span>
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        {/* Focusable because its content changes without the panel itself
            moving — a keyboard user tabbing off the rail lands on the text
            that just replaced what they were reading. */}
        <div
          className="pipeline__panel"
          id="pipeline-panel"
          role="tabpanel"
          aria-labelledby={`pipeline-tab-${stage.id}`}
          tabIndex={0}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage.id}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: EASE }}
            >
              <p className="pipeline__step label-caps">
                Step {index + 1} of {STAGES.length} · {stage.title}
              </p>
              <p className="pipeline__detail">{stage.detail}</p>
              <span className="card__tag">{stage.tag}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
