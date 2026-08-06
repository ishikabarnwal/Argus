require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const evidenceRouter = require('./routes/evidence');
const authRouter = require('./routes/auth');
const casesRouter = require('./routes/cases');

/**
 * Origins the browser may call this API from.
 *
 * Comma-separated in CORS_ORIGINS, defaulting to the Vite dev server so a
 * fresh clone works with no configuration. A deployed frontend lives on a
 * different origin from the API, which is what makes this necessary at all —
 * in local development the Vite proxy keeps everything same-origin.
 *
 * Trailing slashes are stripped because an Origin header never has one, and
 * `https://argus.vercel.app/` in the env file would otherwise fail to match
 * `https://argus.vercel.app` in a way that is genuinely hard to spot.
 */
const DEFAULT_ORIGINS = 'http://localhost:5173';

const allowedOrigins = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS)
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const app = express();

/**
 * Mounted before everything, so preflight is answered without touching a
 * route or parsing a body.
 *
 * No `credentials`: the token travels in an Authorization header from
 * localStorage, not a cookie, so the browser has no credentials to withhold
 * and turning it on would only widen what this allows.
 *
 * A rejected origin gets `false` rather than an Error — that omits the CORS
 * headers and lets the browser refuse the response, which is the actual
 * mechanism, instead of turning a routine cross-origin call into a 500.
 *
 * None of this is authorization. CORS is enforced by browsers and nothing
 * else; curl ignores it entirely. Access is decided by requireAuth and the
 * ownership checks behind it.
 */
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header at all: curl, health checks, server-to-server.
      if (!origin) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
  }),
);

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/evidence', evidenceRouter);

// Express 5 forwards rejected promises from async route handlers here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Logged because a CORS misconfiguration is otherwise invisible from the
    // server side — it looks like a working API and a broken browser.
    console.log(`CORS allowing: ${allowedOrigins.join(', ')}`);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
