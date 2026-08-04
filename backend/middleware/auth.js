const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Fail at startup, not at the first login. A fallback default here would be
// worse than no auth at all: it would look like it worked, while every
// deployment shared a secret anyone reading the source could forge tokens with.
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it to backend/.env before starting the server.');
}

const TOKEN_TTL = '7d';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );
}

/**
 * Rejects anything without a valid bearer token; otherwise populates
 * req.user with { id, email, role }.
 *
 * The role travels inside the signed token rather than being re-read from the
 * database on every request. That is the cheap option and it is fine here, but
 * it means a role change only takes effect when the user next signs in.
 */
function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in to continue' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired — sign in again' });
  }
}

/** Use after requireAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Your account does not have access to that' });
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
