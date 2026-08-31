// =============================================================================
// USER CREATE - Business Logic
// =============================================================================

async (payload, maybeOptions) => {
  const skipQueryCacheClear =
    maybeOptions &&
    typeof maybeOptions === 'object' &&
    maybeOptions.skipQueryCacheClear === true;

  const allowedAccountStatus = new Set(['IMPORTED', 'ACTIVE']);
  const accountStatus =
    payload.account_status && allowedAccountStatus.has(payload.account_status)
      ? payload.account_status
      : 'ACTIVE';

  const email = String(payload.email || '').trim();
  const username = payload.username || email.split('@')[0];
  const firstName = payload.first_name;
  const lastName = payload.last_name;
  const displayName =
    payload.display_name || `${firstName || ''} ${lastName || ''}`.trim();
  const cardNormalized =
    payload.corporate_card_id === undefined || payload.corporate_card_id === null
      ? null
      : String(payload.corporate_card_id).trim() || null;

  const passwordHash = await metarhia.metautil.hashPassword(payload.password);

  try {
    const user = await lib.repository.user.create({
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      displayName,
      phone: payload.phone || null,
      position: payload.position || null,
      employeeId: payload.employee_id || null,
      hireDate: payload.hire_date || null,
      departmentRoleAssignmentId: payload.department_role_assignment_id || null,
      corporateCardId: cardNormalized,
      tenantId: payload.tenant_id || null,
      accountStatus,
      skipQueryCacheClear,
    });
    const { password_hash: _omit, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint?.includes('email')) throw new Error('Email already exists');
      if (error.constraint?.includes('username')) {
        throw new Error('Username already exists');
      }
      if (String(error.constraint || '').includes('corporate_card')) {
        throw new Error('Corporate card id is already in use');
      }
      throw new Error('User already exists');
    }
    throw error;
  }
};
