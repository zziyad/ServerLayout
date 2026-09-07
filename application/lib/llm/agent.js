({
  extractToolCalls: (message) => {
    const calls = [];
    const listed = Array.isArray(message?.tool_calls)
      ? message.tool_calls
      : [];
    for (const item of listed) {
      const fn = item.function || item;
      let args = fn.arguments || item.arguments || {};
      if (typeof args === 'string') {
        try {
          args = args.trim() ? JSON.parse(args) : {};
        } catch {
          args = { raw: args };
        }
      }
      calls.push({
        id: item.id || `call_${calls.length + 1}`,
        name: fn.name || item.name,
        arguments: args && typeof args === 'object' ? args : {},
      });
    }
    if (calls.length > 0) return calls;

    const content = String(message?.content || '');
    const blocks = content.matchAll(/<tool_call>\s*([\s\S]*?)<\/tool_call>/g);
    for (const match of blocks) {
      const inner = match[1].trim();
      try {
        const parsed = JSON.parse(inner);
        calls.push({
          id: `call_${calls.length + 1}`,
          name: parsed.name || parsed.tool,
          arguments: parsed.arguments || parsed.params || {},
        });
      } catch {
        const name = inner.split(/\s+/)[0];
        if (name) {
          calls.push({
            id: `call_${calls.length + 1}`,
            name,
            arguments: {},
          });
        }
      }
    }
    return calls.filter((call) => call.name);
  },

  run: async (payload, context) => {
    if (!config.llm.enabled) {
      const error = new Error('LLM is disabled');
      error.code = 'LLM_DISABLED';
      throw error;
    }

    const incoming = Array.isArray(payload.messages)
      ? payload.messages
      : [];
    const history = [];
    history.push({
      role: 'system',
      content: config.llm.systemPrompt,
    });
    for (const item of incoming) {
      if (!item || !item.role || item.role === 'system') continue;
      history.push({
        role: item.role,
        content: item.content || '',
        ...(item.tool_call_id ? { tool_call_id: item.tool_call_id } : {}),
        ...(item.tool_calls ? { tool_calls: item.tool_calls } : {}),
      });
    }
    if (payload.message) {
      history.push({ role: 'user', content: String(payload.message) });
    }

    const tools = lib.llm.tools.definitions();
    const maxSteps = Number(config.llm.maxSteps || 8);
    const trace = [];
    const signal = context?.signal;

    for (let step = 0; step < maxSteps; step += 1) {
      const completion = await lib.llm.client.chat({
        messages: history,
        tools,
        signal,
      });
      const message = completion.message || {
        role: 'assistant',
        content: '',
      };
      const calls = lib.llm.agent.extractToolCalls(message);

      if (calls.length === 0) {
        return {
          answer: String(message.content || '').trim(),
          steps: step + 1,
          finishReason: completion.finishReason,
          trace,
        };
      }

      history.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls || calls.map((call) => ({
          id: call.id,
          type: 'function',
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments || {}),
          },
        })),
      });

      for (const call of calls) {
        const result = await lib.llm.tools.execute(call, context);
        const content = lib.llm.tools.clip(result);
        trace.push({
          step: step + 1,
          name: call.name,
          arguments: call.arguments,
          result,
        });
        history.push({
          role: 'tool',
          tool_call_id: call.id,
          content,
        });
      }
    }

    const error = new Error(`Agent stopped after ${maxSteps} tool steps`);
    error.code = 'AGENT_MAX_STEPS';
    error.trace = trace;
    throw error;
  },
});
