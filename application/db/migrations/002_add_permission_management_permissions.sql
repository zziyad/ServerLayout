-- Migration: add permission management permissions (permission.read, .create, .update, .delete)
-- Idempotent: only inserts if (resource, action) does not already exist

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
