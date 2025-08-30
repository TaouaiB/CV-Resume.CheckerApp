const { Schema, model } = require('mongoose');
const { ROLES } = require('../../shared/constants/roles');

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  emailVerified: { type: Boolean, default: false },

  // 🔒 login defenses
  failedLoginCount: { type: Number, default: 0 },
  lastFailedAt: { type: Date },
  lockUntil: { type: Date }, // lock account until this date
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ lockUntil: 1 }); //  helpful for admin dashboards

module.exports = model('User', UserSchema);
