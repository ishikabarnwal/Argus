const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('../models/User');
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
 * Note the shortcut: the caller picks their own role, so anyone can sign up as
 * an investigator. That is wrong for anything real — investigator accounts
 * should be issued, not self-claimed — and is only acceptable because this is
 * a prototype with no admin surface to issue them from.
 */
router.post('/signup', async (req, res) => {
  const { email, password, role = 'user' } = req.body || {};

  if (!email || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  }

  const normalised = email.toLowerCase().trim();
  if (await User.exists({ email: normalised })) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const user = await User.create({
    email: normalised,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    role,
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
