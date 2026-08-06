import './CaseGraph.css'

/**
 * The relationship graph for a case, from backend/lib/graph.js.
 *
 * Hand-drawn SVG rather than a graph library. A force simulation would need
 * ~100kB of dependency, an animation loop and a settling delay, and would
 * land the nodes somewhere different on every visit — for the twenty-odd
 * entities a prototype case holds, a fixed circle says the same thing, reads
 * the same way twice, and costs nothing to load.
 *
 * Nodes sit on the circle in the order the API returns them, which groups
 * them by type; edges are chords across it. The layout is deterministic, so
 * two people looking at the same case see the same picture.
 *
 * Encoding: colour is the group, shape is the exact type, and every node
 * carries its value as a label. Identity never rests on colour alone — which
 * matters here, because the three colours are all the locked palette can
 * supply (see --entity-* in styles/tokens.css).
 */

/** Colour group and mark shape per entity type. Types come from graph.js. */
const NODE_STYLES = {
  name: { color: 'var(--entity-person)', shape: 'circle', label: 'Name' },
  phone: { color: 'var(--entity-handle)', shape: 'circle', label: 'Phone' },
  upi_id: { color: 'var(--entity-handle)', shape: 'diamond', label: 'UPI ID' },
  bank_account: { color: 'var(--entity-handle)', shape: 'square', label: 'Bank account' },
  amount: { color: 'var(--entity-money)', shape: 'circle', label: 'Amount' },
}

const LEGEND = ['name', 'phone', 'upi_id', 'bank_account', 'amount']

const VIEW_W = 880
const VIEW_H = 560
const CX = VIEW_W / 2
const CY = VIEW_H / 2
const MARK = 7

/** Long UPI IDs and account numbers would otherwise run off the canvas. */
const LABEL_MAX = 22

function truncate(value) {
  return value.length > LABEL_MAX ? `${value.slice(0, LABEL_MAX - 1)}…` : value
}

/**
 * Radius grows with the node count so labels do not stack on top of each
 * other, but stops before the labels would leave the viewBox.
 */
function radiusFor(count) {
  return Math.max(110, Math.min(60 + count * 11, 200))
}

/** Marks are drawn around a point, so every shape shares one centre. */
function Mark({ shape, x, y, color, corroborated }) {
  const common = { fill: color, stroke: 'var(--bg-surface)', strokeWidth: 1.5 }

  return (
    <>
      {/* A node seen in more than one piece of evidence gets a ring. That is
          the whole point of the graph, so it is visible without hovering. */}
      {corroborated && (
        <circle cx={x} cy={y} r={MARK + 4.5} fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
      )}

      {shape === 'diamond' && (
        <rect
          x={x - MARK}
          y={y - MARK}
          width={MARK * 2}
          height={MARK * 2}
          transform={`rotate(45 ${x} ${y})`}
          {...common}
        />
      )}
      {shape === 'square' && (
        <rect x={x - MARK + 0.5} y={y - MARK + 0.5} width={MARK * 2 - 1} height={MARK * 2 - 1} rx="1.5" {...common} />
      )}
      {shape === 'circle' && <circle cx={x} cy={y} r={MARK} {...common} />}
    </>
  )
}

export default function CaseGraph({ graph, evidenceCount }) {
  const nodes = graph?.nodes ?? []
  const edges = graph?.edges ?? []

  // Nothing to draw. Which message depends on why, because "nothing was
  // extracted" and "nothing appeared together" are different situations and
  // only one of them is fixed by uploading more.
  if (edges.length === 0) {
    let message
    if (nodes.length === 0) {
      message = 'Nothing was extracted from this case, so there is nothing to connect.'
    } else if (nodes.length === 1) {
      message = 'Only one detail was extracted, so there is nothing to connect it to.'
    } else {
      message = 'No two details appear in the same piece of evidence, so nothing links up yet.'
    }

    return (
      <p className="graph__none">
        {message}
        {evidenceCount === 1 && ' Adding a second piece of evidence is what makes links appear.'}
      </p>
    )
  }

  const radius = radiusFor(nodes.length)
  const step = (Math.PI * 2) / nodes.length

  const placed = nodes.map((node, i) => {
    // From the top, clockwise, so the first type in the API's order starts
    // where the eye does.
    const angle = -Math.PI / 2 + i * step
    return {
      ...node,
      angle,
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
    }
  })

  const byId = new Map(placed.map((node) => [node.id, node]))
  const corroboratedNodes = placed.filter((node) => node.evidenceCount > 1)

  const summary =
    `Relationship graph: ${nodes.length} details connected by ${edges.length} links. ` +
    (corroboratedNodes.length > 0
      ? `Appearing in more than one piece of evidence: ${corroboratedNodes
          .map((node) => node.value)
          .join(', ')}.`
      : 'No detail appears in more than one piece of evidence.')

  return (
    <div className="graph">
      <svg
        className="graph__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={summary}
      >
        {/* Edges first so marks sit on top of them. Recessive on purpose —
            the nodes are the subject, the links are the structure. */}
        <g className="graph__edges">
          {edges.map((edge) => {
            const a = byId.get(edge.source)
            const b = byId.get(edge.target)
            if (!a || !b) return null

            return (
              <line
                key={`${edge.source}|${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={edge.weight > 1 ? 'graph__edge graph__edge--strong' : 'graph__edge'}
              >
                <title>
                  {`${a.value} and ${b.value} — together in ${edge.weight} piece${
                    edge.weight === 1 ? '' : 's'
                  } of evidence`}
                </title>
              </line>
            )
          })}
        </g>

        <g>
          {placed.map((node) => {
            const style = NODE_STYLES[node.type] ?? NODE_STYLES.name
            const onRight = Math.cos(node.angle) >= 0
            const labelX = CX + (radius + 15) * Math.cos(node.angle)
            const labelY = CY + (radius + 15) * Math.sin(node.angle)

            return (
              <g key={node.id}>
                <Mark
                  shape={style.shape}
                  x={node.x}
                  y={node.y}
                  color={style.color}
                  corroborated={node.evidenceCount > 1}
                />
                <text
                  className="graph__label"
                  x={labelX}
                  y={labelY}
                  textAnchor={onRight ? 'start' : 'end'}
                  dominantBaseline="middle"
                >
                  {truncate(node.value)}
                </text>
                {/* Native tooltip — the full value, untruncated, plus the
                    count. No custom tooltip layer to maintain. */}
                <title>
                  {`${style.label}: ${node.value} — in ${node.evidenceCount} piece${
                    node.evidenceCount === 1 ? '' : 's'
                  } of evidence`}
                </title>
              </g>
            )
          })}
        </g>
      </svg>

      <ul className="graph__legend">
        {LEGEND.map((type) => {
          const style = NODE_STYLES[type]
          return (
            <li className="graph__legenditem" key={type}>
              <svg className="graph__swatch" viewBox="0 0 18 18" aria-hidden="true">
                <Mark shape={style.shape} x={9} y={9} color={style.color} />
              </svg>
              {style.label}
            </li>
          )
        })}
        <li className="graph__legenditem graph__legenditem--note">
          <svg className="graph__swatch" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
            <circle cx="9" cy="9" r="4" fill="currentColor" />
          </svg>
          Ringed — in more than one piece of evidence
        </li>
      </ul>
    </div>
  )
}
