({
  access: 'public',
  method: async (payload = {}) => {
    const unit =
      typeof api.auth.signout === 'function'
        ? api.auth.signout()
        : api.auth.signout;
    return unit.method(payload);
  },
});
