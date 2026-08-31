# API Response Contract

## Success

```json
{
  "status": "fulfilled",
  "response": {}
}
```

- `status` is always `fulfilled` for successful requests.
- `response` is endpoint-specific payload and must remain backward compatible.

## Failure

```json
{
  "status": "rejected",
  "response": "Safe user-facing message",
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Canonical/internal message",
    "user_message": "Optional safe message override",
    "details": {},
    "severity": "error"
  }
}
```

- `response` is always present.
- For `rejected`, `response` is always a string.
- `error` is optional metadata and does not replace `status`/`response`.
- Frontend must not require `error` to exist.
- `details` is optional object metadata for diagnostics and UX mapping.
- `severity` can be `error`, `warning`, or `info`.

## Rules

- Do not return rejected object/array payloads inside `response`.
- Do not leak SQL, stack traces, or internal raw exceptions in `response`.
- Use endpoint-specific fallback strings for unknown errors.
- Prefer stable error codes for domain/auth/business failures.

## Legacy/Internal Exceptions

- No auth response-shape exceptions remain among active auth endpoints.
- Internal diagnostic auth endpoints (`auth/test-ip-change`,
  `auth/test-user-agent-change`) also follow the same `fulfilled`/`rejected`
  contract for consistency.
- `auth/stats` follows the same envelope and returns the stats payload under
  `response`.
- Auth type declarations in `application/api/auth/auth.d.ts` are aligned with
  this contract (`ApiResponse<T>`, `ApiFulfilled<T>`, `ApiRejected`).
