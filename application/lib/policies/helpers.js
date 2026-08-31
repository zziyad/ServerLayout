// =============================================================================
// DOMAIN POLICIES - Helpers
// =============================================================================

async () => ({
  getUser: (context) =>
    context?.client?.session?.state || context?.session?.user || null,

  eqId: (a, b) => String(a || '') === String(b || ''),

  normalizePlate: (plate) =>
    String(plate || '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ''),
});
