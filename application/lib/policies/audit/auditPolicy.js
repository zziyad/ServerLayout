// =============================================================================
// POLICY - Audit mandatory events
// =============================================================================

async (context, payload) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  const { eventId, entityType, entityId, action, meta } = payload || {};

  if (!eventId)
    throw await lib.policies.errors('AUDIT_EVENT_REQUIRED', 'eventId required');
  if (!entityType)
    throw await lib.policies.errors(
      'AUDIT_ENTITY_REQUIRED',
      'entityType required',
    );
  if (!entityId)
    throw await lib.policies.errors(
      'AUDIT_ENTITY_ID_REQUIRED',
      'entityId required',
    );
  if (!action)
    throw await lib.policies.errors('AUDIT_ACTION_REQUIRED', 'action required');

  await lib.repository.auditLog.create({
    eventId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_user_id: user?.id || null,
    meta_json: meta || {},
  });

  return true;
};
