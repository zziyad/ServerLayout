-- Idempotent: core Permission rows for RBAC admin UI .
-- Fixes empty permission/list when earlier migrations were not applied.
-- Permission string = resource || '.' || action (matches session permission checks).

-- permission.* (from 002)
INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'permission', 'read', 'List and view permissions', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public."Permission"
  WHERE resource = 'permission' AND action = 'read' AND is_deleted = false
);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'permission', 'create', 'Create new permissions', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public."Permission"
  WHERE resource = 'permission' AND action = 'create' AND is_deleted = false
);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'permission', 'update', 'Update permissions', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public."Permission"
  WHERE resource = 'permission' AND action = 'update' AND is_deleted = false
);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'permission', 'delete', 'Delete (soft) permissions', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public."Permission"
  WHERE resource = 'permission' AND action = 'delete' AND is_deleted = false
);

-- department.* and department.role.* (from 003)
INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department', 'read', 'List and view departments', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department' AND action = 'read' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department', 'create', 'Create departments', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department' AND action = 'create' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department', 'update', 'Update departments', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department' AND action = 'update' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department', 'delete', 'Delete departments', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department' AND action = 'delete' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department.role', 'list', 'List roles within a department', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department.role' AND action = 'list' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department.role', 'create', 'Add role to a department', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department.role' AND action = 'create' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department.role', 'update', 'Update department role', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department.role' AND action = 'update' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'department.role', 'delete', 'Remove role from department', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'department.role' AND action = 'delete' AND is_deleted = false);

-- user.* (API access strings use dots: user.read, user.assign_roles, …)
INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'user', 'create', 'Create users', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'user' AND action = 'create' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'user', 'read', 'Read users', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'user' AND action = 'read' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'user', 'update', 'Update users', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'user' AND action = 'update' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'user', 'delete', 'Delete users', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'user' AND action = 'delete' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'user', 'assign_roles', 'Assign or remove roles on users', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'user' AND action = 'assign_roles' AND is_deleted = false);

-- role.* (role.assign_permission, role.remove_permission, …)
INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'read', 'List and read roles', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'read' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'create', 'Create roles', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'create' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'update', 'Update roles', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'update' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'delete', 'Delete roles', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'delete' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'assign_permission', 'Assign permission to role', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'assign_permission' AND is_deleted = false);

INSERT INTO public."Permission" (resource, action, description, is_system, is_deleted)
SELECT 'role', 'remove_permission', 'Remove permission from role', true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Permission" WHERE resource = 'role' AND action = 'remove_permission' AND is_deleted = false);
