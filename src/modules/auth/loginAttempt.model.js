const { Schema, model } = require('mongoose');

const LoginAttemptSchema = new Schema({
  email: { type: String, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  ip: String,
  userAgent: String,
  success: { type: Boolean, required: true },
  reason: { type: String }, // e.g., 'invalid-credentials', 'locked', 'blocked'
}, { timestamps: true });

LoginAttemptSchema.index({ createdAt: 1 });

module.exports = model('LoginAttempt', LoginAttemptSchema);
