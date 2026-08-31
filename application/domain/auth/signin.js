// =============================================================================
// AUTH SIGNIN - Business Logic
// =============================================================================

async (payload, context) => {
  const identifier = String(payload.email || '')
    .trim()
    .toLowerCase();
  const password = String(payload.password || '');

  let user = await lib.repository.user.findByEmail(identifier);
  if (!user && identifier && !identifier.includes('@')) {
    user = await lib.repository.user.findByUsername(identifier);
  }

  const fail = (code, message, userMessage = message) => {
    const error = new Error(message);
    error.code = code;
    error.userMessage = userMessage;
    throw error;
  };

  if (!user) {
    try {
      console.security('login-failed', {
        identifier,
        ip: context.client.ip,
      });
    } catch {}
    fail(
      'INVALID_CREDENTIALS',
      'Invalid credentials',
      'Invalid email/username or password',
    );
  }

  if (!user.is_active) {
    try {
      console.security('login-failed', {
        identifier,
        ip: context.client.ip,
        reason: 'inactive',
      });
    } catch {}
    fail(
      'ACCOUNT_DISABLED',
      'Account is inactive',
      'Account is deactivated. Please contact administrator.',
    );
  }

  if (user.account_status && user.account_status !== 'ACTIVE') {
    try {
      console.security('login-failed', {
        identifier,
        ip: context.client.ip,
        reason: 'not-active-account-status',
        accountStatus: user.account_status,
      });
    } catch {}
    fail(
      'ACCOUNT_DISABLED',
      'Account is not active',
      'Account is not activated. Please contact administrator.',
    );
  }

  const ok = await metarhia.metautil.validatePassword(
    password,
    user.password_hash,
  );
  if (!ok) {
    try {
      console.security('login-failed', {
        identifier,
        ip: context.client.ip,
      });
    } catch {}
    fail(
      'INVALID_CREDENTIALS',
      'Invalid credentials',
      'Invalid email/username or password',
    );
  }

  const roles = await lib.repository.user.getRoles(user.id);
  const permissions = await lib.repository.user.getPermissions(user.id);

  const {
    department,
    department_role,
    department_id,
  } = await lib.repository.user.getDepartmentContext(user);

  node.setImmediate(async () => {
    try {
      await lib.repository.user.touchLastLogin(user.id);
    } catch (updateError) {
      console.warn('Could not update last_login_at:', updateError);
    }
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    department_id: department_id || department?.id || null,
    department,
    department_role,
    position: user.position,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
    roles: (roles || []).map((role) => ({
      id: role.id,
      name: role.name,
      display_name: role.display_name,
      description: role.description,
    })),
    permissions: (permissions || []).map(
      (permission) => `${permission.resource}.${permission.action}`,
    ),
  };
};
