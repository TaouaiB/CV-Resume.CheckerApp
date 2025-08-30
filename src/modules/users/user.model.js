const { Schema, model } = require('mongoose');
const { ROLES } = require('../../shared/constants/roles');

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });

module.exports = model('User', UserSchema);
