/**
 * Keeping the original upload.
 *
 * Until now only the extracted text survived: a screenshot was OCR'd in
 * memory and thrown away. For evidence that is the wrong trade — the text is
 * an interpretation of the file, and the file is the thing that was actually
 * received. A complaint may need the screenshot itself, and OCR misreads
 * digits (a 3 for an 8) often enough that the original is the only way to
 * settle what a number really was.
 *
 * Cloudinary, because it was already the documented choice for file storage.
 *
 * Configuration is a single CLOUDINARY_URL, which the SDK reads on its own.
 * Without it, storage is simply off: uploads still work and evidence is still
 * extracted and scored, there is just no original to link to. That is
 * deliberate — a prototype should be runnable from a fresh clone with a
 * Mongo URI and a Gemini key, and not one more account.
 */

const { v2: cloudinary } = require('cloudinary');

const isConfigured = Boolean(process.env.CLOUDINARY_URL);

if (isConfigured) {
  // secure so we hand back https URLs; the frontend embeds them in a page
  // that is itself https, and a mixed-content link would simply be blocked.
  cloudinary.config({ secure: true });
}

/** Whether uploads will be stored at all. Logged at startup so the answer is visible. */
function storageEnabled() {
  return isConfigured;
}

/** upload_stream is callback-based and takes a stream; the file is a Buffer. */
function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * Store one uploaded file and return where it landed, or null when storage
 * is switched off.
 *
 * resource_type 'auto' lets Cloudinary sort out image vs PDF vs plain text
 * rather than making this decide, which it would have to do from the same
 * unreliable filename the rest of the upload path already distrusts.
 *
 * @returns {Promise<{ url: string, name: string } | null>}
 */
async function storeOriginal({ buffer, originalName, caseId }) {
  if (!isConfigured) return null;

  // caseId is a free-form string from the upload form and becomes a path
  // segment here, so it is flattened the same way the report filename is.
  const folder = `argus/${String(caseId).replace(/[^A-Za-z0-9._-]/g, '_')}`;

  const result = await uploadBuffer(buffer, { folder, resource_type: 'auto' });

  return { url: result.secure_url, name: originalName };
}

module.exports = { storeOriginal, storageEnabled };
