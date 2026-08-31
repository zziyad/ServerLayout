({
  access: 'department.role.update',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleTemplate.updateSchema()
    const validation = await common.validateSchema(payload, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleTemplate.update(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleTemplate/update error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to update department role template',
      }
    }
  },
})
