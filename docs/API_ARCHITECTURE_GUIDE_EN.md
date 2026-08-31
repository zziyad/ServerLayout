# Architecture Guide For New Endpoints (JSON Schema In API)

## Overview

This guide describes an endpoint architecture based on Clean Architecture and
clear responsibility boundaries between layers.

The key rule is simple: JSON Schema validation is executed in the API layer at
the beginning of the request flow, before any domain call.

To keep endpoint code short and consistent, use:
`lib.validation.validateEndpoint(payload, entity, action)`.

It resolves schema automatically, validates payload, and returns normalized
validated data.

## Project Structure

```text
project-root/
├── application/
│   ├── api/                    # API layer
│   │   └── {entity}/
│   │       ├── create.js
│   │       ├── update.js
│   │       ├── delete.js
│   │       ├── list.js
│   │       └── {custom}.js
│   │
│   ├── domain/                 # Domain layer
│   │   └── {entity}/
│   │       ├── create.js
│   │       ├── update.js
│   │       ├── delete.js
│   │       ├── list.js
│   │       ├── {custom}.js
│   │       └── {entity}Logic.js
│   │
│   └── lib/
│       ├── validation.js       # Validation facade for API layer
│       ├── schemas/            # JSON Schemas
│       │   └── {entity}/
│       │       ├── createSchema.js
│       │       ├── updateSchema.js
│       │       ├── deleteSchema.js
│       │       ├── listSchema.js
│       │       └── {custom}Schema.js
│       │
│       └── repository/
│           └── {entity}/
│               ├── create.js
│               ├── update.js
│               ├── delete.js
│               ├── list.js
│               └── {custom}.js
```

## File Naming Rules

- Entities: `camelCase`
- Actions: `camelCase`
- API/Domain/Repository files: `{action}.js`
- Schema files: `{action}Schema.js`

## Syntax Rules

1. No `module.exports` in endpoint/domain/repository/schema runtime files.
2. API file format must be `({ ... })`.
3. Domain file format must be `async (payload, context) => { ... }`.
4. Repository file format must be `async (data) => { ... }`.
5. Schema file format must be `async () => ({ ... })`.

## Layer Responsibilities

### 1) API Layer

Path: `application/api/{entity}/{action}.js`

Responsibilities:
- Access check metadata (`access`)
- Early JSON Schema validation
- Call domain method
- Normalize response format

Recommended API template:

```javascript
({
  access: '{entity}.{action}',
  method: async (payload) => {
    try {
      const validatedData = await lib.validation.validateEndpoint(
        payload,
        '{entity}',
        '{action}',
      )

      const res = await domain.{entity}.{action}(validatedData, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('{entity}/{action} error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to {action} {entity}',
      }
    }
  },
})
```

### 2) Domain Layer

Path: `application/domain/{entity}/{action}.js`

Responsibilities:
- Business orchestration
- Optional business-rule validation
- Repository calls

```javascript
async (payload, context) => {
  const validation = domain.{entity}.{entity}Logic?.validate{Action}
    ? domain.{entity}.{entity}Logic.validate{Action}(payload)
    : { valid: true, data: payload }

  if (!validation.valid) {
    throw new Error(validation.errors.join('; '))
  }

  const result = await lib.repository.{entity}.{action}(validation.data)
  return result
}
```

### 3) Repository Layer

Path: `application/lib/repository/{entity}/{action}.js`

Responsibilities:
- SQL queries
- Mapping rows to expected output
- Optional cache invalidation for write operations

```javascript
// =============================================================================
// ENTITY ACTION - Repository
// =============================================================================

async (data) => {
  const sql = `INSERT INTO "Entity" (...) VALUES (...) RETURNING *`
  const result = await db.pg.query(sql, [/* params */])

  try {
    db.optimized.clearCache()
  } catch {}

  return result.rows[0]
}
```

## Validation Flow

Recommended flow:

```javascript
const validatedData = await lib.validation.validateEndpoint(
  payload,
  '{entity}',
  '{action}',
)
```

Examples:

```javascript
await lib.validation.validateEndpoint(payload, 'product', 'create')
await lib.validation.validateEndpoint(payload, 'vapp.review', 'markUnderReview')
await lib.validation.validateEndpoint(
  payload,
  'fleet-management.driverSchedule',
  'create',
)
```

Alternative (manual, backward-compatible):

```javascript
const schema = await lib.schemas.{entity}.{action}Schema()
const validation = await common.validateSchema(payload, schema)
if (!validation.valid) {
  throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
}
const validatedData = validation.data
```

## Error Handling

### API
- Catch and return standardized response:
  `{ status: 'rejected', response: 'error message' }`
- Do not leak internal stack traces to clients
- Log internal errors server-side

### Domain
- Throw explicit business errors
- Keep validation messages actionable

### Repository
- Handle DB errors consistently
- Keep cache clear wrapped in `try/catch`

## Checklist

- [ ] API file starts with `(` and ends with `)`
- [ ] API uses `lib.validation.validateEndpoint(...)`
- [ ] Domain method receives validated payload
- [ ] Repository uses parametrized SQL
- [ ] Cache invalidation exists for writes (if needed)
- [ ] No `module.exports` / `export default` in runtime endpoint files
- [ ] File naming follows `{action}.js` / `{action}Schema.js`

## Why This Pattern

- Less duplicated validation code
- Early validation failure, predictable flow
- Better maintainability and readability
- Supports nested schema namespaces
- Keeps API logic consistent across all entities

## Recommendation

Use `lib.validation.validateEndpoint()` for all new endpoints by default.
Keep manual schema validation only for legacy compatibility scenarios.
