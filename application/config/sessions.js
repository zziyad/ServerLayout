({
  sid: 'token',
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  length: 64,
  secret: node.process.env.SESSION_SECRET || node.process.env.APP_SECRET || '',
  regenerate: 60 * 60 * 1000,
  expire: 2 * 60 * 60 * 1000,
  persistent: true,
  // Session TTL configuration (in seconds) — production maximums
  accessTtl: 15 * 60, // 15 min (legacy)
  refreshTtl: 7 * 24 * 60 * 60, // 7 days (legacy)
  // Session-based: idle = inactivity timeout, absolute = hard max from login
  idleTtl: 60 * 60, // 1 hour — logout after this much inactivity (sliding window)
  absoluteTtl: 7 * 24 * 60 * 60, // 7 days — max session lifetime from login (sliding cannot exceed)
  sessionTtl: 60 * 60, // 1 hour — cookie/sliding window (matches idle)
  extendThreshold: 0, // 0 = extend on every activity; 30–60 = throttle Redis writes (sec)
  gracePeriod: 60, // 1 minute — grace for read-only operations
  modalThreshold: 5 * 60, // 5 minutes — show "session expiring" modal this long before idle expiry
  limits: {
    ip: 20,
    user: 5,
  },
});
