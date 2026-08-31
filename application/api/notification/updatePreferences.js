// =============================================================================
// NOTIFICATION UPDATE PREFERENCES API - Update notification preferences for subscription
// =============================================================================

({
  access: 'private', // Requires authentication
  method: async (payload) => {
    const schema = await lib.schemas.notification.updatePreferencesSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;

    try {
      const userId = context?.client?.session?.state?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await domain.notification.updatePreferences(
        validatedData,
        context,
      );
      return { status: 'fulfilled', response: result };
    } catch (err) {
      console.error('notification/updatePreferences error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to update notification preferences',
      };
    }
  },
});
