({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'assignDepartmentRoleAssignment',
        lib,
      )
      const result = await domain.user.assignDepartmentRoleAssignment(
        validatedData,
        context,
      )
      return {
        status: 'fulfilled',
        response: result,
      }
    } catch (error) {
      console.error('user/assignDepartmentRoleAssignment error:', error)
      return {
        status: 'rejected',
        response: error.message || 'Failed to assign department role assignment',
      }
    }
  },
})
