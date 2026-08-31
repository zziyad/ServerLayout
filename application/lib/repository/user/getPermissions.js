// =============================================================================
// USER REPOSITORY - GetPermissions
// =============================================================================

async (userId) => {
  const rolePermissions = await db.pg.query(
    `SELECT DISTINCT p.resource, p.action, p.description
     FROM "Permission" p
     JOIN "RolePermission" rp ON p.id = rp.permission_id
     JOIN "UserRole" ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1 AND ur.is_active = true
       AND (ur.expires_at IS NULL OR ur.expires_at > now())
       AND rp.is_deleted = false
       AND p.is_deleted = false`,
    [userId],
  );
  const userPermissions = await db.pg.query(
    `SELECT p.resource, p.action, p.description, up.is_granted
     FROM "Permission" p
     JOIN "UserPermission" up ON p.id = up.permission_id
     WHERE up.user_id = $1
       AND (up.expires_at IS NULL OR up.expires_at > now())
       AND up.is_deleted = false
       AND p.is_deleted = false`,
    [userId],
  );

  const permissionMap = new Map();
  for (const permission of rolePermissions.rows) {
    permissionMap.set(`${permission.resource}.${permission.action}`, {
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      source: 'role',
    });
  }
  for (const permission of userPermissions.rows) {
    const key = `${permission.resource}.${permission.action}`;
    if (permission.is_granted) {
      permissionMap.set(key, {
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        source: 'user',
      });
    } else {
      permissionMap.delete(key);
    }
  }
  return Array.from(permissionMap.values());
};
