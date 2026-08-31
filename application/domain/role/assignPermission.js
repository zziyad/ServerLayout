// =============================================================================
// ROLE - ASSIGN PERMISSION
// =============================================================================

async ({ roleId, permissionId, grantedBy }) => {
  if (!roleId || !permissionId) {
    throw new Error('Role ID and Permission ID are required');
  }
  if (!grantedBy) {
    throw new Error('Granted by user ID is required');
  }

  try {
    // Check if role exists
    const role = await db.pg.row('Role', ['id'], { id: roleId });
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if permission exists
    const permission = await db.pg.row('Permission', ['id'], {
      id: permissionId,
    });
    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if assignment already exists (use raw query to find it regardless of is_deleted)
    const findQuery = `
      SELECT id, is_deleted
      FROM "RolePermission"
      WHERE role_id = $1 AND permission_id = $2
      LIMIT 1
    `;
    const findResult = await db.pg.query(findQuery, [roleId, permissionId]);

    if (findResult.rows && findResult.rows.length > 0) {
      const existingAssignment = findResult.rows[0];

      // If exists but is_deleted=true, restore it
      if (existingAssignment.is_deleted) {
        const restoreResult = await db.pg.query(
          `UPDATE "RolePermission" SET is_deleted = false, deleted_at = NULL, granted_at = now() WHERE id = $1 RETURNING *`,
          [existingAssignment.id],
        );

        // Clear cache
        try {
          db.optimized.clearCache();
        } catch {}

        return restoreResult.rows[0];
      }
      // If already active, just return success
      return;
    }

    // Create new assignment
    const query = `
      INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.pg.query(query, [roleId, permissionId, grantedBy]);

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Permission already assigned to role');
    }
    console.error('role/assignPermission failed', { error });
    throw error;
  }
};
