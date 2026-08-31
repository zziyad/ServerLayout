// =============================================================================
// USER REPOSITORY - FindPermission
// =============================================================================

async (permissionId) =>
  db.pg.row('Permission', ['id'], { id: permissionId, is_deleted: false });
