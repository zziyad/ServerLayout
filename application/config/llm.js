({
  enabled: node.process.env.LLM_ENABLED !== '0',
  baseUrl: node.process.env.LLM_BASE_URL || 'http://127.0.0.1:8080',
  model:
    node.process.env.LLM_MODEL || 'Qwen/Qwen2.5-14B-Instruct-GGUF:Q4_K_M',
  timeoutMs: Number(node.process.env.LLM_TIMEOUT_MS || 180000),
  maxSteps: Number(node.process.env.LLM_MAX_STEPS || 8),
  temperature: Number(node.process.env.LLM_TEMPERATURE || 0.2),
  maxTokens: Number(node.process.env.LLM_MAX_TOKENS || 2048),
  systemPrompt:
    node.process.env.LLM_SYSTEM_PROMPT ||
    [
      'You are a platform agent.',
      'For users, roles, permissions, departments you MUST call tools.',
      'Never invent records, names, ids, or counts from memory.',
      'List all users → user_list. One user → user_getById.',
      'Roles → role_list / role_getById / role_getPermissions.',
      'Permissions → permission_list / permission_getById.',
      'Departments → department_list / department_getById / department_getStructure.',
      'After tools return, answer in the same language the user used.',
      'Do not invent tool names. Do not expose secrets or raw session tokens.',
    ].join(' '),
});
