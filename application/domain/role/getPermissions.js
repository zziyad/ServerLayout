// =============================================================================
// ROLE - GET PERMISSIONS
// =============================================================================

async ({ roleId }) => {
  if (!roleId) {
    throw new Error('Role ID is required');
  }

  try {
    const query = `
      SELECT 
        p.id,
        p.resource,
        p.action,
        p.description,
        p.is_system,
        rp.granted_at
      FROM "Permission" p
      INNER JOIN "RolePermission" rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1 AND rp.is_deleted = false AND p.is_deleted = false
      ORDER BY p.resource, p.action
    `;

    const result = await db.pg.query(query, [roleId]);

    return result.rows;
  } catch (error) {
    console.error('role/getPermissions failed', { error });
    throw error;
  }
};
