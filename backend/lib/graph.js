/**
 * The relationship graph — which entities turn up together.
 *
 * One rule, and it is worth stating plainly because everything the graph
 * shows follows from it: two entities are connected when they appear in the
 * same piece of evidence. Nothing here infers a relationship the evidence
 * does not literally contain.
 *
 * What that surfaces is corroboration. A phone number in the chat export and
 * again in the bank statement is one node with an evidenceCount of 2 — the
 * same number, reached two ways. An edge with a weight of 2 is a pair that
 * held together across two documents. Those are the parts an investigator
 * actually wants, so both counts travel with the data rather than being
 * recomputed by whatever draws it.
 *
 * Dates and urgency keywords are deliberately not nodes. Every document has
 * a date and most have a keyword, so they would connect to everything and
 * turn the graph into a hairball that says nothing. Only the five entity
 * types that identify a person, a handle or a sum are included.
 */

const { parseAmount, valuesIn } = require('./entities');

/**
 * Entity keys that become nodes, with the type name the frontend colours by.
 * Keys match ai-service/prompts.py; the order is the order nodes come back
 * in, which is what puts same-type nodes beside each other on the circle.
 */
const NODE_TYPES = [
  { key: 'names', type: 'name' },
  { key: 'phone_numbers', type: 'phone' },
  { key: 'upi_ids', type: 'upi_id' },
  { key: 'bank_accounts', type: 'bank_account' },
  { key: 'amounts', type: 'amount' },
];

/**
 * What counts as "the same entity".
 *
 * Matching on the raw string does not work, and the failure is the one that
 * matters most: a chat saying "Rs 45,000" and a statement line reading
 * "45000.00" are the same payment seen twice, which is precisely the link
 * this graph exists to draw — and comparing the text finds nothing. The same
 * goes for "Meera Joshi" against "MEERA JOSHI".
 *
 * So values are matched on a normalised form and displayed as they were
 * written. Only matching is affected; nothing here rewrites evidence.
 *
 * Phone numbers keep their last ten digits, which assumes Indian mobile
 * numbers — the same assumption the rest of the product makes. It is what
 * lets "+91 90000 11111" and "9000011111" be one node.
 */
function identityOf(type, value) {
  const text = String(value);

  if (type === 'amount') {
    // Reuses the scoring rule's reading of an amount, so "₹25,000",
    // "Rs 25000" and "25000.00" agree here exactly as they do there.
    const parsed = parseAmount(text);
    return parsed === null ? text.toLowerCase() : `#${parsed}`;
  }

  if (type === 'phone') {
    const digits = text.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  // Names, UPI IDs and account numbers: case and spacing are not identity.
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Type-qualified, so a name and an amount that read the same are two nodes. */
function nodeId(type, value) {
  return `${type}:${identityOf(type, value)}`;
}

/** Undirected, so the pair is keyed the same whichever order it arrives in. */
function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Build { nodes, edges } for one case.
 *
 * Returns empty lists for a case with no evidence, and a node list with no
 * edges when a single document holds a single entity — both are honest
 * answers, and the frontend decides what is worth drawing.
 *
 * @returns {{ nodes: object[], edges: object[] }}
 */
function buildGraph(evidenceList) {
  const documents = Array.isArray(evidenceList) ? evidenceList : [];

  const nodes = new Map();
  const edges = new Map();

  documents.forEach((document) => {
    // Every node this one document mentions, which is exactly the set that
    // becomes mutually connected.
    //
    // A Set, not a list: one document can name the same entity twice in two
    // spellings ("Meera Joshi" and "MEERA JOSHI"), and those collapse to one
    // id here. Counting it as a list would credit that single document with
    // two appearances and ring a node that only ever showed up once.
    const present = new Set();

    NODE_TYPES.forEach(({ key, type }) => {
      valuesIn(document?.extractedEntities, key).forEach((value) => {
        const id = nodeId(type, value);
        const existing = nodes.get(id);

        if (!existing) {
          // First spelling seen wins the label. The value is displayed as
          // someone actually wrote it, never as the normalised form.
          nodes.set(id, { id, type, value, evidenceCount: 1 });
        } else if (!present.has(id)) {
          existing.evidenceCount += 1;
        }

        present.add(id);
      });
    });

    const ids = [...present];

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const key = edgeKey(ids[i], ids[j]);
        const existing = edges.get(key);

        if (existing) {
          existing.weight += 1;
        } else {
          edges.set(key, { source: ids[i], target: ids[j], weight: 1 });
        }
      }
    }
  });

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

module.exports = { buildGraph, NODE_TYPES };
