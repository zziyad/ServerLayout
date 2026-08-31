// =============================================================================
// POLICY - Venue Scope (Checkpoint bound)
// =============================================================================

async (opts) => {
  const { user, venueId, allowedVenueIds = [] } = opts || {};

  if (!user?.id)
    throw await lib.policies.errors(
      'SCOPE_USER_REQUIRED',
      'user.id is required',
    );
  if (!venueId)
    throw await lib.policies.errors(
      'SCOPE_VENUE_REQUIRED',
      'venueId is required',
    );

  // If your system loads venue assignments into session, check them here.
  const effectiveAllowed = user?.venue_ids || allowedVenueIds || [];

  if (!Array.isArray(effectiveAllowed) || effectiveAllowed.length === 0) {
    throw await lib.policies.errors(
      'SCOPE_VENUE_NOT_BOUND',
      'Checkpoint user has no venue assignment',
      { user_id: user.id },
    );
  }

  if (!effectiveAllowed.map(String).includes(String(venueId))) {
    throw await lib.policies.errors(
      'SCOPE_VENUE_FORBIDDEN',
      'Forbidden: venue not assigned',
      { user_id: user.id, venueId, allowed: effectiveAllowed },
    );
  }

  return true;
};
