({
  access: 'private',
  method: async () => {
    const stats = await context.client.getServerStats();

    return {
      status: 'fulfilled',
      response: {
        timestamp: new Date().toISOString(),
        clients: stats,
        server: {
          uptime: node.process.uptime(),
          memory: node.process.memoryUsage(),
          nodeVersion: node.process.version,
        },
      },
    };
  },
});
