/**
 * The case report — a PDF a victim can actually take somewhere.
 *
 * Nothing here decides anything. The score comes from riskScore.js, the gaps
 * from gaps.js, the entities from what was extracted; this file only lays
 * them out. If a number in the document looks wrong, the rule that produced
 * it is wrong, not the report.
 *
 * Deliberately plain. It is a document meant to be printed, attached to a
 * complaint, or handed across a counter — not a showcase. Colour is used in
 * exactly three places (the risk band, the gap headings, the section rules)
 * and everything else is black on white.
 *
 * The palette is the project's light-theme tokens, because paper is white.
 * Red appears only on a High risk band, which is the same rule the interface
 * follows: red means a confirmed fraud signal and nothing else.
 */

const PDFDocument = require('pdfkit');
const { valuesAcrossCase } = require('./entities');
const { findGaps } = require('./gaps');
const { riskLabel, riskLevel } = require('./riskScore');

/* Light-theme token values from frontend/src/styles/tokens.css. */
const INK = '#1B2340';
const MUTED = '#5C6478';
const RULE = '#D8DEE9';
const GAP = '#6941C6';
const RISK_COLOR = { low: '#1E4C8C', medium: '#B45309', high: '#C42B31' };

const PAGE_MARGIN = 56;

/**
 * What to do next, by band.
 *
 * Advice, not instruction, and deliberately short. The medium case names the
 * one thing that actually protects someone mid-scam: a number from the
 * evidence is exactly the number not to call.
 */
const NEXT_ACTIONS = {
  high: 'File a complaint at cybercrime.gov.in, or call 1930. Take this report and the original files with you — the account numbers and UPI IDs listed above are what a complaint needs.',
  medium:
    'Verify directly with your bank before doing anything else. Use the number printed on your card or statement — not any number that appears in this report.',
  low: 'Monitor for further contact. Keep these files, and add anything new to this case so the score reflects it.',
};

/**
 * Entity types, in the order they are worth reading in a complaint. Keys match
 * ai-service/prompts.py.
 *
 * `mono` marks the fields that are evidence in themselves. They are set in
 * Courier for the same reason the interface sets them in JetBrains Mono: an
 * account number with a 0 read as an O is a real failure, and this is the copy
 * someone may type into a government form.
 */
const ENTITY_GROUPS = [
  { key: 'names', label: 'Names', mono: false },
  { key: 'phone_numbers', label: 'Phone numbers', mono: true },
  { key: 'upi_ids', label: 'UPI IDs', mono: true },
  { key: 'bank_accounts', label: 'Bank accounts', mono: true },
  { key: 'amounts', label: 'Amounts', mono: true },
  { key: 'dates', label: 'Dates mentioned', mono: true },
  { key: 'suspicious_keywords', label: 'Urgency language', mono: false },
];

const EVIDENCE_LABELS = {
  whatsapp: 'WhatsApp export',
  screenshot: 'Screenshot',
  bank_statement: 'Bank statement',
};

/** "12 Aug 2026" — unambiguous, unlike any all-numeric ordering. */
function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Named timezone, because a filing timestamp that cannot be placed is noise. */
function formatTimestamp(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function sectionRule(doc) {
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke();
  doc.moveDown(0.9);
}

function sectionHeading(doc, text, color = INK) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text(text.toUpperCase(), {
    characterSpacing: 1.2,
  });
  doc.moveDown(0.5);
  doc.fillColor(color);
}

/** Label above, value below — the layout used for every meta row. */
function metaRow(doc, label, value, { mono = false, color = INK } = {}) {
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(label);
  doc
    .font(mono ? 'Courier' : 'Helvetica')
    .fontSize(11)
    .fillColor(color)
    .text(value);
  doc.moveDown(0.65);
}

/**
 * Builds the PDF and resolves to a Buffer.
 *
 * Buffered rather than piped straight to the response on purpose: if
 * rendering throws halfway, a piped response has already sent 200 and a
 * partial file, and the browser saves a corrupt PDF. Buffering means a
 * failure is still an error status. These documents are a page or two.
 *
 * @returns {Promise<Buffer>}
 */
function renderCaseReport({ caseDoc, evidence }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Title: `Argus case report — ${caseDoc.caseId}`,
        Author: 'Argus (prototype)',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const score = caseDoc.riskScore;
    const level = riskLevel(score);
    const generatedAt = new Date();

    /* ---- masthead -------------------------------------------------- */

    doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED).text('ARGUS', { characterSpacing: 2 });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text('Case report');
    doc.moveDown(1.1);
    sectionRule(doc);

    /* ---- the case at a glance -------------------------------------- */

    metaRow(doc, 'Case ID', caseDoc.caseId, { mono: true });
    metaRow(doc, 'Fraud risk score', `${score} / 100 — ${riskLabel(score)}`, {
      color: RISK_COLOR[level],
    });

    if (evidence.length > 0) {
      const first = formatDate(evidence[0].uploadedAt);
      const last = formatDate(evidence[evidence.length - 1].uploadedAt);
      metaRow(
        doc,
        'Evidence uploaded',
        first === last ? first : `${first} to ${last}`,
      );
    }

    metaRow(doc, 'Report generated', formatTimestamp(generatedAt));

    /* ---- what the report is based on ------------------------------- */

    sectionRule(doc);
    sectionHeading(doc, `Evidence on file (${evidence.length})`);

    if (evidence.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Nothing has been filed on this case.');
      doc.moveDown(0.8);
    } else {
      evidence.forEach((item) => {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(INK)
          .text(`${EVIDENCE_LABELS[item.type] ?? item.type} — ${formatDate(item.uploadedAt)}`);
      });
      doc.moveDown(0.9);
    }

    /* ---- entities -------------------------------------------------- */

    sectionRule(doc);
    sectionHeading(doc, 'Extracted details');

    const groups = ENTITY_GROUPS.map((group) => ({
      ...group,
      values: valuesAcrossCase(evidence, group.key),
    })).filter((group) => group.values.length > 0);

    if (groups.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(MUTED)
        .text('Nothing was extracted from the evidence on this case.');
      doc.moveDown(0.8);
    } else {
      groups.forEach((group) => {
        doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(group.label);
        doc
          .font(group.mono ? 'Courier' : 'Helvetica')
          .fontSize(10.5)
          .fillColor(INK)
          .text(group.values.join('    '), { lineGap: 2 });
        doc.moveDown(0.6);
      });
      doc.moveDown(0.3);
    }

    /* ---- gaps ------------------------------------------------------ */

    const gaps = findGaps(evidence);

    if (gaps.length > 0) {
      sectionRule(doc);
      sectionHeading(doc, 'Missing evidence');

      gaps.forEach((gap) => {
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(GAP).text(gap.title);
        doc.font('Helvetica').fontSize(10).fillColor(INK).text(gap.detail, { lineGap: 1 });
        doc.font('Courier').fontSize(10).fillColor(MUTED).text(gap.values.join('    '));
        doc.moveDown(0.7);
      });

      doc.moveDown(0.2);
    }

    /* ---- what to do next ------------------------------------------- */

    sectionRule(doc);
    sectionHeading(doc, 'Suggested next step');

    doc.font('Helvetica-Bold').fontSize(11).fillColor(RISK_COLOR[level]).text(riskLabel(score));
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(10.5).fillColor(INK).text(NEXT_ACTIONS[level], { lineGap: 1.5 });
    doc.moveDown(1.2);

    /* ---- the standing caveat --------------------------------------- */

    sectionRule(doc);
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        'Prototype build — please use the synthetic sample case, not real evidence. Extracted details are produced by a language model and may be incomplete or wrong; check them against the original files before relying on them.',
        { lineGap: 1.5 },
      );

    doc.end();
  });
}

module.exports = { renderCaseReport, NEXT_ACTIONS };
