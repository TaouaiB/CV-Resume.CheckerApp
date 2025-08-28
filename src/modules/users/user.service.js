// src/modules/users/user.service.js
const User = require('./user.model');

function toPublicUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  };
}

async function getUserPublicById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }
  return toPublicUser(user);
}



module.exports = { getUserPublicById, toPublicUser };
