({
  access: 'department.role.delete',
  method: async (payload) => {
    const schema = await lib.schemas.departmentRoleAssignment.deleteSchema()
    const validation = await common.validateSchema(payload, schema)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    try {
      const res = await domain.departmentRoleAssignment.delete(validation.data, context)
      return { status: 'fulfilled', response: res }
    } catch (err) {
      console.error('departmentRoleAssignment/delete error:', err)
      return {
        status: 'rejected',
        response: err.message || 'Failed to delete department role assignment',
      }
    }
  },
})
