({
  access: 'department.role.create',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleTemplate.createSchema()
    const validation = await common.validateSchema(payload, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleTemplate.create(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleTemplate/create error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to create department role template',
      }
    }
  },
})
