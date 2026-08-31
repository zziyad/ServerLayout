// =============================================================================
// Clock (Current Server Time)
// =============================================================================
// Returns current server time in UTC ISO format
// Frontend will convert to user timezone for display

({
  access: 'public',
  method: async (payload, context) => {
    try {
      // Get current UTC time from database (most accurate)
      const result = await db.pg.query(`SELECT now() as current_time`);
      const serverTime = result.rows?.[0]?.current_time;
      const fallback = {
        status: 'fulfilled',
        response: {
          utc: new Date().toISOString(),
          timestamp: Date.now(),
        },
      };

      if (!serverTime) return fallback;

      return {
        status: 'fulfilled',
        response: {
          utc: serverTime.toISOString(),
          timestamp: serverTime.getTime(),
        },
      };
    } catch (err) {
      return fallback;
    }
  },
});
