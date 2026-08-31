// =============================================================================
// ROLE - REMOVE PERMISSION (SOFT DELETE)
// =============================================================================

async ({ roleId, permissionId }) => {
  if (!roleId || !permissionId) {
    throw new Error('Role ID and Permission ID are required');
  }

  try {
    // Check if assignment exists (use raw query to ensure we find it regardless of is_deleted)
    const findQuery = `
      SELECT id, is_deleted
      FROM "RolePermission"
      WHERE role_id = $1 AND permission_id = $2
      LIMIT 1
    `;
    const findResult = await db.pg.query(findQuery, [roleId, permissionId]);

    if (!findResult.rows || findResult.rows.length === 0) {
      throw new Error('Permission is not assigned to this role');
    }

    const assignment = findResult.rows[0];

    // If already deleted, return success (idempotent operation)
    if (assignment.is_deleted) {
      return assignment;
    }

    // Soft delete (set is_deleted = true)
    const updateQuery = `
      UPDATE "RolePermission"
      SET is_deleted = true, deleted_at = now()
      WHERE id = $1 AND is_deleted = false
      RETURNING *
    `;

    const result = await db.pg.query(updateQuery, [assignment.id]);

    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        'Failed to remove permission - record may have been deleted',
      );
    }

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    console.error('role/removePermission failed', {
      error,
      roleId,
      permissionId,
    });
    throw error;
  }
};
