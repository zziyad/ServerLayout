// =============================================================================
// QR CODE UTILITIES - Generate QR Code Images (Server-side)
// =============================================================================

({
  /**
   * Generate QR code image from payload
   *
   * Note: Requires 'qrcode' npm package: npm install qrcode
   *
   * @param {string} payload - QR payload string (e.g., "VAPP:<eventId>:<token>")
   * @param {Object} [options] - QR code options
   * @param {string} [options.type='png'] - Output type: 'png' | 'svg'
   * @param {number} [options.size=200] - Image size in pixels
   * @param {string} [options.errorCorrectionLevel='M'] - Error correction: 'L' | 'M' | 'Q' | 'H'
   * @returns {Promise<string>} - Base64 data URL (png) or SVG string (svg)
   */
  generateQrCode: async (payload, options = {}) => {
    try {
      // Dynamic require - will fail gracefully if package not installed
      const QRCode = require('qrcode');

      const { type = 'png', size = 200, errorCorrectionLevel = 'M' } = options;

      if (type === 'svg') {
        return await QRCode.toString(payload, {
          type: 'svg',
          width: size,
          errorCorrectionLevel,
          margin: 1,
        });
      }

      return await QRCode.toDataURL(payload, {
        width: size,
        errorCorrectionLevel,
        margin: 1,
      });
    } catch (error) {
      if (error?.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'qrcode package not installed. Run: npm install qrcode',
        );
      }
      throw error;
    }
  },

  /**
   * Generate QR payload string following VAPP standard
   *
   * @param {string} eventId - Event ID
   * @param {string} qrToken - QR token
   * @returns {string} - Formatted payload: "VAPP:<eventId>:<qrToken>"
   */
  formatQrPayload: (eventId, qrToken) => {
    return `VAPP:${eventId}:${qrToken}`;
  },

  /**
   * Parse QR payload string
   *
   * @param {string} payload - QR payload string
   * @returns {{prefix: string, eventId: string, token: string} | null}
   */
  parseQrPayload: (payload) => {
    if (!payload || typeof payload !== 'string') return null;

    const parts = payload.split(':');
    if (parts.length !== 3 || parts[0] !== 'VAPP') return null;

    return {
      prefix: parts[0],
      eventId: parts[1],
      token: parts[2],
    };
  },
});
