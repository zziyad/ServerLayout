({
  access: 'department.role.create',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleAssignment.createSchema()
    const validation = await common.validateSchema(payload, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleAssignment.create(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleAssignment/create error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to create department role assignment',
      }
    }
  },
})
