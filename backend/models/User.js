const mongoose = require('mongoose');

/**
 * Two roles, and the difference is what you can see:
 *
 *   user          a fraud victim. Creates cases, uploads evidence, and can
 *                 read only the cases they own.
 *   investigator  reads every case, writes nothing.
 *
 * Anything more granular is future scope; see the access rules in
 * middleware/auth.js and routes/evidence.js.
 */
const ROLES = ['user', 'investigator'];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // select: false keeps the hash out of every query result by default, so it
  // cannot be handed back in an API response by accident. Login has to ask
  // for it explicitly with .select('+password').
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/** The shape safe to send to a client: no hash, no internals. */
userSchema.methods.toPublic = function toPublic() {
  return { id: this._id.toString(), email: this.email, role: this.role };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
