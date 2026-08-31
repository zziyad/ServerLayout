({
  serializeErrorResponse(err, fallbackMessage = 'Request failed') {
    const fallback =
      typeof fallbackMessage === 'string' && fallbackMessage.trim()
        ? fallbackMessage.trim()
        : 'Request failed'

    const normalizeDetails = (details) =>
      details && typeof details === 'object' ? details : {}

    const toStructuredError = (source) => {
      const code =
        typeof source?.code === 'string' && source.code.trim()
          ? source.code.trim()
          : null
      if (!code) {
        return null
      }

      const canonicalMessage =
        typeof source?.message === 'string' && source.message.trim()
          ? source.message.trim()
          : code

      const userMessage =
        typeof source?.userMessage === 'string' && source.userMessage.trim()
          ? source.userMessage.trim()
          : typeof source?.user_message === 'string' && source.user_message.trim()
            ? source.user_message.trim()
            : null

      const severity =
        typeof source?.severity === 'string' && source.severity.trim()
          ? source.severity.trim()
          : 'error'

      return {
        response: userMessage || fallback,
        error: {
          code,
          message: canonicalMessage,
          ...(userMessage ? { user_message: userMessage } : {}),
          details: normalizeDetails(source?.details),
          severity,
        },
      }
    }

    const isGatePassError =
      typeof lib.errors.isGatePassError === 'function'
        ? lib.errors.isGatePassError
        : lib.errors.isGatePassError?.isGatePassError
    const serializeGatePassError =
      typeof lib.errors.serializeGatePassError === 'function'
        ? lib.errors.serializeGatePassError
        : lib.errors.serializeGatePassError?.serializeGatePassError

    if (isGatePassError?.(err) && serializeGatePassError) {
      return {
        response: err.userMessage || fallback,
        error: serializeGatePassError(err),
      }
    }

    const structured = toStructuredError(err)
    if (structured) {
      return structured
    }

    return {
      response: fallback,
      error: null,
    }
  },
})
