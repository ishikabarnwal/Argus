const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

// Deliberately loose: enough to catch a typo, not an attempt to decide what a
// valid address is. The only real test of an email is sending to it.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/signup
 *
 * Always creates a 'user'. Any role in the body is ignored rather than
 * rejected: this is not a request we want to help anyone get right, and a 400
 * naming the valid roles would advertise that 'investigator' is a thing worth
 * asking for.
 *
 * Investigator accounts read every case in the system, so they have to be
 * granted, not claimed. There is no admin surface to grant one from, so it is
 * a database edit — see "Accounts and roles" in the README. The role is signed
 * into the token, so it applies from that account's next sign-in.
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const normalised = email.toLowerCase().trim();
  if (await User.exists({ email: normalised })) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const user = await User.create({
    email: normalised,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    // No role: the schema default is 'user', and not naming it here means
    // there is no line to accidentally start feeding from the request body.
  });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password' });
  }

  // password is select:false on the schema, so it has to be asked for.
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // One message for "no such account" and for "wrong password". Telling them
  // apart hands an attacker a way to discover which emails are registered.
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    return res.status(401).json({ error: 'Email or password is incorrect' });
  }

  res.json({ token: signToken(user), user: user.toPublic() });
});

/** GET /api/auth/me — lets the frontend confirm a stored token still works. */
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Your account no longer exists' });

  res.json({ user: user.toPublic() });
});

module.exports = router;
