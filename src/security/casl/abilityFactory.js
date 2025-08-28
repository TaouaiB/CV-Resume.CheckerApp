const { AbilityBuilder, Ability, subject } = require('@casl/ability');
const { ROLES } = require('../../shared/constants/roles');
const { SUBJECTS } = require('./subjects');
const { userRulesFor } = require('./user.rules');
const { adminRulesFor } = require('./admin.rules');

function buildAbility(user) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (user?.role === ROLES.ADMIN) {
    adminRulesFor(user, { can, cannot });
  } else {
    userRulesFor(user || { id: 'anonymous', role: ROLES.USER }, { can, cannot });
  }

  return build({
    // We’ll pass subjects using `subject('Type', obj)` so detection isn’t needed here
    detectSubjectType: (item) => item?.__type,
  });
}

module.exports = { buildAbility, subject, SUBJECTS };
