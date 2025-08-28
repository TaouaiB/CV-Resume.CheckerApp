const { SUBJECTS } = require('../casl/subjects');

function userRulesFor(user, { can /*, cannot*/ }) {
  const uid = String(user.id);

  // Profiles
  can('read', SUBJECTS.PROFILE, { userId: uid });
  can('update', SUBJECTS.PROFILE, { userId: uid });

  // Files (own files)
  can('create', SUBJECTS.FILE);
  can('read', SUBJECTS.FILE, { ownerId: uid });
  can('delete', SUBJECTS.FILE, { ownerId: uid });

  // Analyses (own)
  can('create', SUBJECTS.ANALYSIS);
  can('read', SUBJECTS.ANALYSIS, { ownerId: uid });

  // Users (self)
  can('read', SUBJECTS.USER, { _id: uid });
  can('update', SUBJECTS.USER, { _id: uid });
}

module.exports = { userRulesFor };
