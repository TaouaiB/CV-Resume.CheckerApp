// src/security/authz.js
const { buildAbility } = require('./casl/abilityFactory');

// Normalize Mongoose docs into plain objects with string IDs for CASL condition checks
function normalizeDoc(doc) {
  if (!doc) return null;
  const obj =
    typeof doc.toObject === 'function' ?
      doc.toObject({ virtuals: false })
    : { ...doc };
  if (obj._id) obj._id = String(obj._id);
  if (obj.ownerId) obj.ownerId = String(obj.ownerId);
  if (obj.userId) obj.userId = String(obj.userId);
  return obj;
}

/**
 * Usage:
 *   authorize('read', 'File', async (req) => File.findById(req.params.id))
 *   authorize('create', 'Analysis') // no resource loader
 */
function authorize(
  action,
  subjectName,
  loader /* optional: (req) => Promise<doc> */
) {
  return async (req, res, next) => {
    try {
      const ability = buildAbility(req.user || {});
      if (!loader) {
        return ability.can(action, { __type: subjectName }) ? next() : (
            res.status(403).json({ error: 'Forbidden' })
          );
      }

      const doc = await loader(req);
      if (!doc)
        return res.status(404).json({ error: `${subjectName} not found` });

      const normalized = normalizeDoc(doc);
      // Inject __type so detectSubjectType matches
      const typed = { __type: subjectName, ...normalized };

      const ok = ability.can(action, typed);
      if (!ok) return res.status(403).json({ error: 'Forbidden' });

      res.locals.resource = doc; // pass through for controller if needed
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { authorize };
