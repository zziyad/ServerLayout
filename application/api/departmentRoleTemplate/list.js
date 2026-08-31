({
  access: 'department.role.list',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleTemplate.listSchema()
    const validation = await common.validateSchema(payload || {}, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleTemplate.list(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleTemplate/list error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to list department role templates',
      }
    }
  },
})
