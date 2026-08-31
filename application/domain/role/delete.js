// =============================================================================
// ROLE - DELETE (SOFT DELETE)
// =============================================================================

async ({ id }) => {
  if (!id) {
    throw new Error('Role ID is required');
  }

  try {
    // Check if role exists and is not system role
    const role = await db.pg.row('Role', ['id', 'name', 'is_system'], { id });
    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent deletion of system roles
    if (role.is_system) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const usersWithRole = await db.pg.query(
      `SELECT COUNT(*) as count FROM "UserRole" WHERE role_id = $1 AND is_active = true`,
      [id],
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    // Soft delete
    const query = `
      UPDATE "Role"
      SET is_deleted = true, deleted_at = now()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.pg.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Role not found');
    }

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    console.error('role/delete failed', { error });
    throw error;
  }
};
