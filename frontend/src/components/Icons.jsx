/**
 * Inline icon set. Drawn rather than imported so the stroke weight matches the
 * hero's trace work and the whole page keeps one line quality.
 *
 * All icons share a 24x24 box, 1.5 stroke, round caps, and inherit
 * currentColor.
 */

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** A frame with a deliberate hole in it — the gap is the subject. */
export function IconGap() {
  return (
    <svg {...base}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M12 9.5v5" strokeDasharray="1.5 2.5" />
    </svg>
  )
}

/** Arrow leaving a bracket — output that points somewhere. */
export function IconAction() {
  return (
    <svg {...base}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M13 12h7" />
      <path d="m17 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  )
}

/** A person inside a shield — protection aimed at an individual. */
export function IconPerson() {
  return (
    <svg {...base}>
      <path d="M12 21c-4-1.6-6.5-5-6.5-9V6.2L12 3.5l6.5 2.7V12c0 4-2.5 7.4-6.5 9Z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8.8 16.2a3.4 3.4 0 0 1 6.4 0" />
    </svg>
  )
}

export function IconChat() {
  return (
    <svg {...base}>
      <path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 14.5v-8A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5Z" />
      <path d="M8.5 9h7" />
      <path d="M8.5 12.5h4" />
    </svg>
  )
}

export function IconImage() {
  return (
    <svg {...base}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m4.5 17 4.2-4.2a1.6 1.6 0 0 1 2.2 0L15 16.4" />
      <path d="m13.8 15.2 1.9-1.9a1.6 1.6 0 0 1 2.2 0l1.6 1.6" />
    </svg>
  )
}

/** Stacked sheets — the three supported evidence types. */
export function IconLayers() {
  return (
    <svg {...base}>
      <path d="m12 3.5 8.5 4.2-8.5 4.3-8.5-4.3Z" />
      <path d="m3.5 12 8.5 4.3 8.5-4.3" />
      <path d="m3.5 16.2 8.5 4.3 8.5-4.3" />
    </svg>
  )
}

/** Spark — extraction done by the model rather than by hand. */
export function IconSpark() {
  return (
    <svg {...base}>
      <path d="M12 3.5 13.9 9 19.5 11l-5.6 2L12 18.5 10.1 13 4.5 11 10.1 9Z" />
      <path d="M18.5 4v3" />
      <path d="M17 5.5h3" />
    </svg>
  )
}

/** Open padlock — free to use, no paywall in front of it. */
export function IconOpenLock() {
  return (
    <svg {...base}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.9-.8" />
      <path d="M12 14v2.5" />
    </svg>
  )
}

export function IconStatement() {
  return (
    <svg {...base}>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 12.5h7" />
      <path d="M9 16h4.5" />
    </svg>
  )
}

/** Clock — a manufactured deadline. */
export function IconClock() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

/** A medal — authority that is claimed rather than held. */
export function IconSeal() {
  return (
    <svg {...base}>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="m8.4 14.1-1.4 6.4 5-2.4 5 2.4-1.4-6.4" />
    </svg>
  )
}

/** A key — an OTP authorises a payment, it does not introduce anyone. */
export function IconKey() {
  return (
    <svg {...base}>
      <circle cx="8" cy="15" r="3.5" />
      <path d="m10.6 12.6 7.4-7.4" />
      <path d="m15.4 7.8 2 2" />
      <path d="m18 5.2 2 2" />
    </svg>
  )
}

/** A stack of coins — the small fee that has to be paid first. */
export function IconCoins() {
  return (
    <svg {...base}>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.75" />
      <path d="M5.5 6.5v5c0 1.5 2.9 2.75 6.5 2.75s6.5-1.25 6.5-2.75v-5" />
      <path d="M5.5 11.5v5c0 1.5 2.9 2.75 6.5 2.75s6.5-1.25 6.5-2.75v-5" />
    </svg>
  )
}

/** Sun — shown when light mode is what the button switches TO. */
export function IconSun() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="m5.6 5.6 1.4 1.4" />
      <path d="m17 17 1.4 1.4" />
      <path d="m18.4 5.6-1.4 1.4" />
      <path d="m7 17-1.4 1.4" />
    </svg>
  )
}

/** Crescent — shown when dark mode is what the button switches TO. */
export function IconMoon() {
  return (
    <svg {...base}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  )
}

/** Plain cross — starting something, in the sidebar's icon-only rail. */
export function IconPlus() {
  return (
    <svg {...base}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </svg>
  )
}

/** Arrow leaving an open-sided frame — on your way out. */
export function IconSignOut() {
  return (
    <svg {...base}>
      <path d="M9.5 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4h4" />
      <path d="M15 8.5l3.5 3.5-3.5 3.5" />
      <path d="M18.5 12H9.5" />
    </svg>
  )
}
