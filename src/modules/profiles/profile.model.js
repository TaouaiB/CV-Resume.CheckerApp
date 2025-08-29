const { Schema, model } = require('mongoose');

const ProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
    headline: { type: String, default: '' },
    bio:      { type: String, default: '' },
    skills:   { type: [String], default: [] },
    links:    { type: [String], default: [] },
    languages:{ type: [String], default: [] },
    location: { type: String, default: '' },
    avatarUrl:{ type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = model('Profile', ProfileSchema);
