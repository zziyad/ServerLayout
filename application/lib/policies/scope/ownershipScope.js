// =============================================================================
// POLICY - Ownership Scope
// =============================================================================

async (opts) => {
  const { user, entity, ownerField = 'requester_user_id' } = opts || {};

  if (!user?.id)
    throw await lib.policies.errors(
      'SCOPE_USER_REQUIRED',
      'user.id is required',
    );
  if (!entity)
    throw await lib.policies.errors(
      'SCOPE_ENTITY_REQUIRED',
      'entity is required',
    );

  const ownerId = entity?.[ownerField];
  if (!ownerId) {
    throw await lib.policies.errors(
      'SCOPE_OWNER_FIELD_MISSING',
      `Entity missing owner field "${ownerField}"`,
      { ownerField },
    );
  }

  if (String(ownerId) !== String(user.id)) {
    throw await lib.policies.errors('SCOPE_NOT_OWNER', 'Forbidden: not owner', {
      user_id: user.id,
      owner_id: ownerId,
    });
  }

  return true;
};
