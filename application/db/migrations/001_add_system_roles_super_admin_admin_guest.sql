-- Migration: add system roles super_admin, admin, guest
-- Idempotent: only inserts if role name does not already exist (active)

INSERT INTO public."Role" (name, display_name, description, is_system, is_active, is_deleted)
SELECT 'super_admin', 'Super Administrator', 'Full access; bypasses all permission checks.', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Role" WHERE name = 'super_admin' AND is_deleted = false);

INSERT INTO public."Role" (name, display_name, description, is_system, is_active, is_deleted)
SELECT 'admin', 'Administrator', 'Administrative access for user and system management.', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Role" WHERE name = 'admin' AND is_deleted = false);

INSERT INTO public."Role" (name, display_name, description, is_system, is_active, is_deleted)
SELECT 'guest', 'Guest', 'Limited read-only or unauthenticated access.', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public."Role" WHERE name = 'guest' AND is_deleted = false);

-- Assign super_admin role to user 568a6282-9b06-41c2-804a-84ad61365b83 (self-assign; idempotent)
INSERT INTO public."UserRole" (user_id, role_id, assigned_by, is_active, is_deleted)
SELECT
  '568a6282-9b06-41c2-804a-84ad61365b83'::uuid,
  'a7e1eb08-b123-4530-a155-a55291d9f2dd'::uuid,
  '568a6282-9b06-41c2-804a-84ad61365b83'::uuid,
  true,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public."UserRole"
  WHERE user_id = '568a6282-9b06-41c2-804a-84ad61365b83'::uuid
    AND role_id = 'a7e1eb08-b123-4530-a155-a55291d9f2dd'::uuid
    AND is_deleted = false
    AND is_active = true
);
