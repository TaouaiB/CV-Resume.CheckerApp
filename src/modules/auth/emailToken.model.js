const { Schema, model } = require('mongoose');

const EmailTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['verify', 'reset_password'],
      required: true,
    },
    tokenHash: { type: String, unique: true, index: true, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

EmailTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { consumedAt: { $exists: false } },
  }
);

module.exports = model('EmailToken', EmailTokenSchema);
