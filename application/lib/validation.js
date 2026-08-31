({
  resolveSchema: async (entity, action) => {
    const entityPath = entity.split('.')
    let schemaModule = lib.schemas

    for (const part of entityPath) {
      schemaModule = schemaModule?.[part]
      if (!schemaModule) {
        const error = new Error(`Schema entity not found: ${entity}`)
        error.code = 'SCHEMA_NOT_FOUND'
        throw error
      }
    }

    const schemaName = `${action}Schema`
    const schemaGetter = schemaModule?.[schemaName]

    if (typeof schemaGetter !== 'function') {
      const error = new Error(`Schema not found: ${entity}.${schemaName}`)
      error.code = 'SCHEMA_NOT_FOUND'
      throw error
    }

    return schemaGetter()
  },

  validateEndpoint: async (payload, entity, action) => {
    try {
      const schema = await lib.validation.resolveSchema(entity, action)
      const validation = await common.validateSchema(payload, schema)

      if (!validation.valid) {
        const error = new Error(
          `Validation failed: ${validation.errors.join('; ')}`,
        )
        error.code = 'VALIDATION_ERROR'
        throw error
      }

      return validation.data
    } catch (error) {
      const validationError = new Error(
        error?.message || 'Validation failed',
      )
      validationError.code = error?.code || 'VALIDATION_ERROR'
      throw validationError
    }
  },
})