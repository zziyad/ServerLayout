// =============================================================================
// POLICY - Event Scope
// =============================================================================

async (opts) => {
  const { eventId, entity, entityEventField = 'event_id' } = opts || {};

  if (!eventId)
    throw await lib.policies.errors(
      'SCOPE_EVENT_REQUIRED',
      'eventId is required',
    );
  if (!entity)
    throw await lib.policies.errors(
      'SCOPE_ENTITY_REQUIRED',
      'entity is required',
    );

  const entityEventId = entity?.[entityEventField];

  if (!entityEventId) {
    throw await lib.policies.errors(
      'SCOPE_ENTITY_EVENT_MISSING',
      `entity missing "${entityEventField}"`,
      { entityEventField },
    );
  }

  if (String(entityEventId) !== String(eventId)) {
    throw await lib.policies.errors(
      'SCOPE_EVENT_MISMATCH',
      'Entity does not belong to event',
      { eventId, entityEventId },
    );
  }

  return true;
};
