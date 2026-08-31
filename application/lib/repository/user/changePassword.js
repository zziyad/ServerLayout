// =============================================================================
// USER REPOSITORY - Change Password
// =============================================================================

async (userId, passwordHash) => {
  const query = `
    UPDATE "User" 
    SET password_hash = $1, updated_at = now()
    WHERE id = $2 AND is_deleted = false
    RETURNING id, email, username, first_name, last_name, display_name,
              phone, position, employee_id, hire_date, avatar_url, is_active,
              created_at, updated_at, department_role_assignment_id, tenant_id,
              account_status
  `;

  const values = [passwordHash, userId];

  const result = await db.pg.query(query, values);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  // Clear cache after write
  try {
    db.optimized.clearCache();
  } catch (e) {
    // ignore cache errors
  }

  return result.rows[0];
};
