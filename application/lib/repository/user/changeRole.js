// =============================================================================
// USER REPOSITORY - ChangeRole
// =============================================================================

async ({ userId, roleId, action, changedBy }) => {
  const user = await db.pg.row('User', ['id', 'is_deleted'], { id: userId });
  if (!user) throw new Error('User not found');
  if (user.is_deleted) throw new Error('Cannot modify deleted user');

  const role = await db.pg.row('Role', ['id', 'name', 'is_system'], {
    id: roleId,
  });
  if (!role) throw new Error('Role not found');

  const existingRole = await db.pg.row('UserRole', ['*'], {
    user_id: userId,
    role_id: roleId,
  });

  if (action === 'assign') {
    if (existingRole && existingRole.is_active) {
      throw new Error('Role is already assigned to this user');
    }
    if (existingRole && !existingRole.is_active) {
      await db.pg.update(
        'UserRole',
        {
          is_active: true,
          assigned_at: new Date(),
          assigned_by: changedBy,
        },
        { user_id: userId, role_id: roleId },
      );
    } else {
      await db.pg.insert('UserRole', {
        user_id: userId,
        role_id: roleId,
        assigned_by: changedBy,
        assigned_at: new Date(),
        is_active: true,
      });
    }
  } else if (action === 'remove') {
    if (!existingRole || !existingRole.is_active) {
      throw new Error('Role is not assigned to this user');
    }
    await db.pg.update(
      'UserRole',
      { is_active: false },
      { user_id: userId, role_id: roleId },
    );
  }

  try {
    db.optimized.clearCache();
  } catch {}
  return role;
};
