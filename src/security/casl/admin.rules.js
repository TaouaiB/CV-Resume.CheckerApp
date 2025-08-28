const { SUBJECTS } = require('../casl/subjects');
function adminRulesFor(_user, { can }) {
  can('manage', SUBJECTS.ALL);
}
module.exports = { adminRulesFor };
