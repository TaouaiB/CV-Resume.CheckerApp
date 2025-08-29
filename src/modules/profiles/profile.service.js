const Profile = require('./profile.model');
const { ApiError } = require('../../shared/errors/ApiError');

async function getOrCreateMyProfile(userId) {
  let doc = await Profile.findOne({ userId });
  if (!doc) doc = await Profile.create({ userId });
  return toPublic(doc);
}

async function updateMyProfile(userId, patch) {
  const doc = await Profile.findOneAndUpdate(
    { userId },
    { $set: patch },
    { new: true, upsert: true }
  );
  if (!doc) throw ApiError.server('Failed to update profile');
  return toPublic(doc);
}

function toPublic(doc) {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    headline: doc.headline,
    bio: doc.bio,
    skills: doc.skills,
    links: doc.links,
    languages: doc.languages,
    location: doc.location,
    avatarUrl: doc.avatarUrl,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

module.exports = { getOrCreateMyProfile, updateMyProfile };
