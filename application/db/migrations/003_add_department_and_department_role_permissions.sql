-- Migration: add department and department.role permissions (so assign/list roles work)
-- Idempotent: only inserts if (resource, action) does not already exist
-- Permission string = resource.action (e.g. department.role.list => resource=department.role, action=list)

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
