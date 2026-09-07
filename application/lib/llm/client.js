({
  request: async (pathname, body, signal) => {
    const base = String(config.llm.baseUrl || 'http://127.0.0.1:8080').replace(
      /\/$/,
      '',
    );
    const url = new node.url.URL(pathname, `${base}/`);
    const payload = Buffer.from(JSON.stringify(body));
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? node.https : node.http;
    const timeoutMs = Number(config.llm.timeoutMs || 180000);

    return await new Promise((resolve, reject) => {
      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': payload.length,
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode < 200 || res.statusCode >= 300) {
              const error = new Error(
                `LLM HTTP ${res.statusCode}: ${raw.slice(0, 500)}`,
              );
              error.code = 'LLM_HTTP_ERROR';
              reject(error);
              return;
            }
            try {
              resolve(JSON.parse(raw));
            } catch (err) {
              const error = new Error('LLM returned non-JSON body');
              error.code = 'LLM_BAD_JSON';
              error.cause = err;
              reject(error);
            }
          });
        },
      );

      req.on('error', (err) => {
        const error = new Error(`LLM unreachable: ${err.message}`);
        error.code = 'LLM_UNREACHABLE';
        error.cause = err;
        reject(error);
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy();
        const error = new Error(`LLM timeout after ${timeoutMs}ms`);
        error.code = 'LLM_TIMEOUT';
        reject(error);
      });

      if (signal) {
        if (signal.aborted) {
          req.destroy();
          const error = new Error('LLM request aborted');
          error.code = 'LLM_ABORTED';
          reject(error);
          return;
        }
        signal.addEventListener(
          'abort',
          () => {
            req.destroy();
          },
          { once: true },
        );
      }

      req.write(payload);
      req.end();
    });
  },

  chat: async ({ messages, tools, signal }) => {
    const body = {
      model: config.llm.model,
      messages,
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens,
      stream: false,
    };
    if (Array.isArray(tools) && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }
    const data = await lib.llm.client.request(
      '/v1/chat/completions',
      body,
      signal,
    );
    const choice = data?.choices?.[0] || {};
    return {
      message: choice.message || { role: 'assistant', content: '' },
      finishReason: choice.finish_reason || null,
      raw: data,
    };
  },
});
