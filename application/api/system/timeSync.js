({
  access: 'public',
  method: async () => {
    try {
      // const db = application.db
      const now = new Date();
      const nodeTime = now.toISOString();
      const nodeTimestamp = now.getTime();

      // Get PostgreSQL time
      let pgTime = null;
      let pgTimestamp = null;
      let pgTimezone = null;
      let pgTimeDiff = null;

      try {
        const pgResult = await db.pg.query(`
					SELECT 
						now() as current_time,
						extract(epoch from now()) * 1000 as timestamp_ms,
						current_setting('timezone') as timezone
				`);
        if (pgResult.rows && pgResult.rows[0]) {
          pgTime = pgResult.rows[0].current_time.toISOString();
          pgTimestamp = Math.floor(pgResult.rows[0].timestamp_ms);
          pgTimezone = pgResult.rows[0].timezone;
          pgTimeDiff = Math.abs(nodeTimestamp - pgTimestamp);
        }
      } catch (error) {
        console.error('Error getting PostgreSQL time:', error);
      }

      // Get Redis time (if available)
      let redisTime = null;
      let redisTimestamp = null;
      let redisTimeDiff = null;

      try {
        const redis = application.redis;
        if (redis) {
          const redisTimeResult = await redis.time();
          if (Array.isArray(redisTimeResult) && redisTimeResult.length >= 2) {
            // Redis TIME returns [seconds, microseconds]
            redisTimestamp =
              redisTimeResult[0] * 1000 + Math.floor(redisTimeResult[1] / 1000);
            redisTime = new Date(redisTimestamp).toISOString();
            redisTimeDiff = Math.abs(nodeTimestamp - redisTimestamp);
          }
        }
      } catch (error) {
        console.error('Error getting Redis time:', error);
      }

      // Calculate maximum time difference
      const timeDiffs = [];
      if (pgTimeDiff !== null) timeDiffs.push(pgTimeDiff);
      if (redisTimeDiff !== null) timeDiffs.push(redisTimeDiff);
      const maxDiff = timeDiffs.length > 0 ? Math.max(...timeDiffs) : 0;

      // Determine sync status
      const isSynced = maxDiff < 1000; // Less than 1 second difference
      const syncStatus = isSynced ? 'synchronized' : 'drift_detected';

      return {
        status: 'fulfilled',
        response: {
          sync_status: syncStatus,
          max_time_difference_ms: maxDiff,
          components: {
            nodejs: {
              time: nodeTime,
              timestamp: nodeTimestamp,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            postgresql: pgTime
              ? {
                  time: pgTime,
                  timestamp: pgTimestamp,
                  timezone: pgTimezone,
                  difference_ms: pgTimeDiff,
                }
              : { error: 'Unable to get PostgreSQL time' },
            redis: redisTime
              ? {
                  time: redisTime,
                  timestamp: redisTimestamp,
                  difference_ms: redisTimeDiff,
                }
              : { error: 'Unable to get Redis time' },
          },
          recommendations:
            maxDiff > 5000
              ? [
                  'Time difference exceeds 5 seconds. Check NTP synchronization on host.',
                  'Verify timezone settings in docker-compose.yml',
                  'Restart containers if time drift persists',
                ]
              : maxDiff > 1000
              ? [
                  'Time difference detected. Monitor for drift.',
                  'Ensure NTP is running on host system',
                ]
              : ['All components are synchronized'],
        },
      };
    } catch (error) {
      console.error('timeSync error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to check time synchronization',
      };
    }
  },
});
