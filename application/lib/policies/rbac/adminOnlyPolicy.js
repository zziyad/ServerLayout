async ({ context, allowedRoles }) => {
  const helpers = await lib.policies.helpers();
  const user = helpers.getUser(context);

  console.log('USER', user);

  if (!user) {
    throw await lib.policies.errors('AUTH_REQUIRED', 'Login required');
  }

  const allowed = allowedRoles || ['admin', 'super_admin'];

  // роли реально лежат тут
  const roles = Array.isArray(user.roles) ? user.roles : [];

  const hasAllowedRole = roles.some((r) => allowed.includes(r?.name));

  console.log(
    'ROLES',
    roles.map((r) => r?.name),
  );

  if (!hasAllowedRole) {
    throw await lib.policies.errors(
      'RBAC_FORBIDDEN',
      'Admin privileges required',
      { roles: roles.map((r) => r?.name), allowed },
    );
  }

  return true;
};
