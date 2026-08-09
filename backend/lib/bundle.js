/**
 * The whole case in one file: the PDF report, plus every original upload
 * that was kept.
 *
 * The report says what Argus made of the evidence. The originals are the
 * evidence. Someone walking into a police station wants both, and wants them
 * as one download rather than as a report and then eleven separate saves.
 *
 * Buffered rather than streamed to the response, for the reason report.js
 * gives: a piped archive that fails halfway has already sent 200, and the
 * browser saves a truncated ZIP that looks like a real one. Buffering keeps a
 * failure an error status. These bundles are a handful of files.
 */

const archiver = require('archiver');
const { renderCaseReport } = require('./report');

/** One slow file should not hold the whole download open indefinitely. */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Make a stored filename safe to write into an archive.
 *
 * Original names come from whatever the uploader's machine called the file,
 * so they can contain path separators or `..`. Left alone, those are a
 * zip-slip: an extractor that honours the path writes outside the folder the
 * user chose. Only the basename survives, and only safe characters in it.
 */
function safeName(name, fallback) {
  const base = String(name ?? '')
    .split(/[/\\]/)
    .pop()
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 80);

  return base.length > 0 ? base : fallback;
}

/**
 * Pull one original back from storage.
 *
 * @returns {Promise<Buffer | null>} null when it could not be retrieved
 */
async function fetchOriginal(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    // Timed out, DNS, TLS, or storage refused it. The caller records the miss
    // rather than failing the whole bundle over one file.
    return null;
  }
}

/** Collect an archiver stream into a single Buffer. */
function zipToBuffer(entries) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip');
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('warning', reject);
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));

    entries.forEach((entry) => archive.append(entry.body, { name: entry.name }));
    archive.finalize();
  });
}

/**
 * Build the bundle for one case.
 *
 * Evidence with no fileUrl is skipped without comment — pasted text and
 * uploads made while storage was off never had an original, and there is
 * nothing missing to report. An original that *was* stored but cannot be
 * fetched is different: that is a gap between what the case says it holds and
 * what the ZIP contains, so the archive carries a note saying which.
 *
 * A case with no originals at all still produces a valid ZIP holding just
 * the report.
 *
 * @returns {Promise<{ zip: Buffer, included: number, missing: string[] }>}
 */
async function buildCaseBundle({ caseDoc, evidence }) {
  const pdf = await renderCaseReport({ caseDoc, evidence });

  const entries = [{ name: 'report.pdf', body: pdf }];
  const missing = [];

  // Numbered in upload order, which is the order the report lists them in, so
  // the third file in the folder is the third row in the document. It also
  // keeps two files that were both called "screenshot.png" apart.
  const stored = evidence.filter((item) => item.fileUrl);

  for (const [index, item] of stored.entries()) {
    const position = String(index + 1).padStart(2, '0');
    const name = `${position}-${safeName(item.fileName, `${item.type}-${position}`)}`;

    // Sequential on purpose. These are free-tier services either end, and a
    // burst of parallel fetches is a good way to be rate limited for no gain
    // on a handful of files.
    const body = await fetchOriginal(item.fileUrl);

    if (body) entries.push({ name: `originals/${name}`, body });
    else missing.push(name);
  }

  if (missing.length > 0) {
    entries.push({
      name: 'originals/MISSING.txt',
      body:
        'These files are recorded on the case but could not be retrieved from storage ' +
        `when this bundle was built on ${new Date().toISOString()}:\n\n` +
        missing.map((name) => `  ${name}\n`).join('') +
        '\nThe report lists every piece of evidence on the case, including these.\n',
    });
  }

  const zip = await zipToBuffer(entries);

  return { zip, included: entries.length - 1 - (missing.length > 0 ? 1 : 0), missing };
}

module.exports = { buildCaseBundle, safeName };
