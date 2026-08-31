async (userId) => {
  return await lib.repository.userPermission.listByUser(userId);
};
