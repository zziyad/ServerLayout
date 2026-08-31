({
  access: 'department.role.delete',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleTemplate.deleteSchema()
    const validation = await common.validateSchema(payload, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleTemplate.delete(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleTemplate/delete error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to delete department role template',
      }
    }
  },
})
