({
  catalog: () => [
    {
      name: 'now',
      access: null,
      description: 'Current server time in ISO-8601.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async () => ({ iso: new Date().toISOString() }),
    },
    {
      name: 'whoami',
      access: null,
      description: 'Current authenticated user from the session.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async (_args, context) => ({ user: lib.llm.tools.sessionUser(context) }),
    },
    {
      name: 'health',
      access: null,
      description: 'Postgres and Redis health checks.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async (_args, context) => {
        const checks = {
          postgres: await common.checkPostgres(
            typeof db !== 'undefined' ? db.pg : null,
          ),
          redis: await common.checkRedis(context?.client?.sessionManager),
        };
        return common.summarize(checks);
      },
    },
    {
      name: 'user_list',
      access: 'user.read',
      description:
        'List platform users. Use this for any question about users, accounts, who exists. Do not invent users.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          search: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'deleted'] },
          role: { type: 'string' },
        },
      },
      run: async (args) =>
        domain.user.list({
          page: args.page || 1,
          limit: Math.min(args.limit || 20, 100),
          search: args.search,
          status: args.status,
          role: args.role,
        }),
    },
    {
      name: 'user_getById',
      access: 'user.read',
      description: 'Get one user by UUID.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string', description: 'User UUID' } },
      },
      run: async (args) => domain.user.getById(args.id),
    },
    {
      name: 'role_list',
      access: 'role.read',
      description:
        'List roles. Use for any question about roles. includeSystem=true to include super_admin/admin/app_user.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: { includeSystem: { type: 'boolean' } },
      },
      run: async (args) => domain.role.list({ includeSystem: args.includeSystem !== false }),
    },
    {
      name: 'role_getById',
      access: 'role.read',
      description: 'Get one role by UUID.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      run: async (args) => domain.role.getById({ id: args.id }),
    },
    {
      name: 'role_getPermissions',
      access: 'role.read',
      description: 'List permissions granted to a role.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string', description: 'Role UUID' } },
      },
      run: async (args) => domain.role.getPermissions({ roleId: args.id }),
    },
    {
      name: 'permission_list',
      access: 'permission.read',
      description:
        'List permissions. Use for any question about what rights exist.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          resource: { type: 'string' },
          action: { type: 'string' },
        },
      },
      run: async (args) =>
        domain.permission.list({
          resource: args.resource,
          action: args.action,
        }),
    },
    {
      name: 'permission_getById',
      access: 'permission.read',
      description: 'Get one permission by UUID.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      run: async (args) => domain.permission.getById({ id: args.id }),
    },
    {
      name: 'department_list',
      access: 'department.read',
      description:
        'List departments. Use for any question about departments.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          search: { type: 'string' },
        },
      },
      run: async (args, context) =>
        domain.department.list(
          {
            page: args.page || 1,
            limit: Math.min(args.limit || 20, 100),
            search: args.search,
          },
          context,
        ),
    },
    {
      name: 'department_getById',
      access: 'department.read',
      description: 'Get one department by UUID.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      run: async (args) => domain.department.getById({ id: args.id }),
    },
    {
      name: 'department_getStructure',
      access: 'department.read',
      description: 'Department tree / structure.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async (args, context) => domain.department.getStructure(args || {}, context),
    },
    {
      name: 'departmentRoleTemplate_list',
      access: 'department.role.list',
      description: 'List department role templates.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async (args, context) => domain.departmentRoleTemplate.list(args || {}, context),
    },
    {
      name: 'departmentRoleAssignment_list',
      access: 'department.role.list',
      description: 'List department role assignments.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async (args, context) => domain.departmentRoleAssignment.list(args || {}, context),
    },
  ],

  definitions: () =>
    lib.llm.tools.catalog().map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),

  clip: (value) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (text.length <= 8000) return text;
    return `${text.slice(0, 8000)}…`;
  },

  sessionUser: (context) => {
    const session = context?.client?.session?.state || {};
    const auth = session.auth || {};
    return {
      user_id: auth.user_id || session.id || null,
      roles: auth.roles || session.roles || [],
      permissions: auth.permissions || session.permissions || [],
    };
  },

  can: (context, access) => {
    if (!access) return true;
    const snap = lib.llm.tools.sessionUser(context);
    const roleNames = (snap.roles || []).map((role) =>
      typeof role === 'string' ? role : role?.name,
    );
    if (roleNames.includes('super_admin')) return true;
    return (snap.permissions || []).includes(access);
  },

  execute: async (call, context) => {
    const name = String(call?.name || '');
    const tool = lib.llm.tools.catalog().find((item) => item.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    if (!lib.llm.tools.can(context, tool.access)) {
      return { ok: false, error: `permission required: ${tool.access}` };
    }
    try {
      const args = call.arguments && typeof call.arguments === 'object'
        ? call.arguments
        : {};
      const result = await tool.run(args, context);
      return { ok: true, result: result ?? null };
    } catch (err) {
      return { ok: false, error: err.message || 'tool failed' };
    }
  },
});
