// =============================================================================
// TIMEZONE UTILITIES - Centralized timezone handling for the backend API
// =============================================================================
//
// Architecture:
// - Server/DB operates in UTC (fixed)
// - User timezone is stored in cookie (IANA format: tz=Asia/Baku)
// - Cookie used only at system boundaries:
//   - When interpreting dates entered by user
//   - When formatting dates returned to user
// - All calculations/comparisons/storage in UTC

({
  TIMEZONE_COOKIE_NAME: 'tz',
  DEFAULT_TIMEZONE: 'UTC',

  /**
   * Extract timezone from request cookies
   * @param {object} context - Request context (has client.getCookies())
   * @returns {string} IANA timezone string (e.g., 'Asia/Baku') or 'UTC' if not set
   */
  getUserTimezoneFromCookie: (context) => {
    const TIMEZONE_COOKIE_NAME = 'tz';
    const DEFAULT_TIMEZONE = 'UTC';

    if (!context || !context.client) {
      return DEFAULT_TIMEZONE;
    }

    try {
      const cookies = context.client.getCookies();
      const timezone = cookies[TIMEZONE_COOKIE_NAME];

      if (!timezone) {
        return DEFAULT_TIMEZONE;
      }

      // Validate timezone format using inline validation
      // (Can't call other functions in object literal pattern, so inline the check)
      if (!timezone || typeof timezone !== 'string') {
        return DEFAULT_TIMEZONE;
      }

      if (timezone === 'UTC' || timezone === 'GMT') {
        return timezone;
      }

      if (
        !timezone.includes('/') &&
        !['UTC', 'GMT', 'EST', 'PST', 'CST', 'MST'].includes(timezone)
      ) {
        console.warn(
          `[timezone] Invalid timezone in cookie: ${timezone}, using UTC`,
        );
        return DEFAULT_TIMEZONE;
      }

      const validPattern =
        /^[A-Z][a-z]+\/[A-Z][a-zA-Z_]+$|^UTC$|^GMT$|^[A-Z]{3,4}$/;
      if (validPattern.test(timezone)) {
        return timezone;
      }

      console.warn(
        `[timezone] Invalid timezone in cookie: ${timezone}, using UTC`,
      );
      return DEFAULT_TIMEZONE;
    } catch (error) {
      console.error('[timezone] Error reading timezone cookie:', error);
      return DEFAULT_TIMEZONE;
    }
  },

  /**
   * Validate IANA timezone format
   * @param {string} timezone - Timezone string to validate
   * @returns {boolean} True if valid IANA timezone
   */
  validateIANATimezone: (timezone) => {
    if (!timezone || typeof timezone !== 'string') return false;

    // Basic validation: check if it's a valid IANA timezone format
    // IANA timezones are like: Continent/City (e.g., Asia/Baku, America/New_York)
    // Or UTC, GMT, etc.
    if (timezone === 'UTC' || timezone === 'GMT') return true;

    // Check format: should have at least one slash or be a known abbreviation
    if (
      !timezone.includes('/') &&
      !['UTC', 'GMT', 'EST', 'PST', 'CST', 'MST'].includes(timezone)
    ) {
      return false;
    }

    // Try to validate using a test (we can't use Intl in Node.js the same way)
    // For now, accept common patterns
    const validPattern =
      /^[A-Z][a-z]+\/[A-Z][a-zA-Z_]+$|^UTC$|^GMT$|^[A-Z]{3,4}$/;
    return validPattern.test(timezone);
  },

  /**
   * Parse date string in user timezone and convert to UTC ISO
   * Handles datetime-local format (YYYY-MM-DDTHH:mm) from frontend
   * @param {string} dateStr - Date string in user timezone (datetime-local format)
   * @param {string} userTimezone - User timezone (IANA format)
   * @returns {string|null} UTC ISO string or null if invalid
   */
  parseDateInUserTimezone: (dateStr, userTimezone) => {
    const DEFAULT_TIMEZONE = 'UTC';

    if (!dateStr) return null;

    const tz = userTimezone || DEFAULT_TIMEZONE;

    try {
      // Handle datetime-local format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
      const match = dateStr.match(
        /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/,
      );
      if (match) {
        const [, datePart, timePart, seconds] = match;
        const timeWithSeconds = seconds
          ? `${timePart}:${seconds}`
          : `${timePart}:00`;

        // Use PostgreSQL to convert from user timezone to UTC
        // This is the most reliable method
        // Format: (timestamp AT TIME ZONE timezone) AT TIME ZONE 'UTC'
        // We'll construct a SQL query to do the conversion
        // But since we're in a utility function, we need to use the database
        // Actually, we should do this conversion in the API layer where we have db access
        // For now, return a format that can be converted by the API layer

        // Return an object that indicates we need timezone conversion
        // The API layer will handle the actual conversion using PostgreSQL
        return {
          datePart,
          timePart: timeWithSeconds,
          timezone: tz,
          needsConversion: true,
        };
      }

      // If already UTC ISO format, return as-is
      if (
        dateStr.includes('T') &&
        (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr))
      ) {
        return dateStr;
      }

      // Try to parse as Date (will interpret as local server time, not ideal)
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      return null;
    } catch (error) {
      console.error('[timezone] Error parsing date in user timezone:', error);
      return null;
    }
  },

  /**
   * Convert UTC ISO to user timezone for display
   * Note: API responses should return ISO UTC timestamps.
   * This function is only for endpoints explicitly designed for presentation.
   * @param {string} utcIso - UTC ISO string
   * @param {string} userTimezone - User timezone (IANA format)
   * @param {object} options - Formatting options
   * @returns {string} Formatted date string in user timezone
   */
  formatDateForUser: (utcIso, userTimezone, options = {}) => {
    const DEFAULT_TIMEZONE = 'UTC';

    if (!utcIso) return '-';

    const tz = userTimezone || DEFAULT_TIMEZONE;

    try {
      const date = new Date(utcIso);
      if (isNaN(date.getTime())) return '-';

      // Use Intl.DateTimeFormat for formatting
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz,
        ...options,
      });

      return formatter.format(date);
    } catch (error) {
      console.error('[timezone] Error formatting date for user:', error);
      return '-';
    }
  },

  /**
   * Convert datetime-local string from user timezone to UTC using PostgreSQL
   * This should be called in API endpoints that have database access
   * @param {object} db - Database connection
   * @param {string} datePart - Date part (YYYY-MM-DD)
   * @param {string} timePart - Time part (HH:mm:ss)
   * @param {string} userTimezone - User timezone (IANA format)
   * @returns {Promise<string|null>} UTC ISO string or null if invalid
   */
  convertDatetimeLocalToUtc: async (db, datePart, timePart, userTimezone) => {
    const DEFAULT_TIMEZONE = 'UTC';

    if (!db || !datePart || !timePart) return null;

    const tz = userTimezone || DEFAULT_TIMEZONE;

    try {
      // Use PostgreSQL timezone conversion
      // Format: (timestamp AT TIME ZONE timezone) AT TIME ZONE 'UTC'
      const result = await db.pg.query(
        `SELECT (($1 || ' ' || $2)::timestamp AT TIME ZONE $3) AT TIME ZONE 'UTC' as utc_time`,
        [datePart, timePart, tz],
      );

      const utc = result.rows?.[0]?.utc_time;
      if (utc) {
        return new Date(utc).toISOString();
      }

      return null;
    } catch (error) {
      console.error(
        '[timezone] Error converting datetime-local to UTC:',
        error,
      );
      return null;
    }
  },
});
