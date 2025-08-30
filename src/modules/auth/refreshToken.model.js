const { Schema, model } = require('mongoose');

const RefreshTokenSchema = new Schema({
  jti:       { type: String, unique: true, index: true, required: true },
  userId:    { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  issuedAt:  { type: Date,  default: () => new Date() },
  expiresAt: { type: Date,  required: true },
  rotatedAt: { type: Date },
  revokedAt: { type: Date },
  reason:    { type: String }, // e.g., 'logout', 'rotation', 'reuse-detected'
  userAgent: { type: String },
  ip:        { type: String },
}, { timestamps: true });

module.exports = model('RefreshToken', RefreshTokenSchema);
