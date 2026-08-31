-- Docker first-run seed: global system admin.
-- Login: admin@gp.com
-- Password: password
-- IMPORTANT: change password after first login.

ALTER TABLE public."User"
  ALTER COLUMN tenant_id DROP NOT NULL;

INSERT INTO public."Role" (
  name,
  display_name,
  description,
  is_system,
  is_active,
  is_deleted
)
VALUES (
  'super_admin',
  'Super Administrator',
  'Global technical owner/full-access bypass.',
  true,
  true,
  false
)
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system = true,
  is_active = true,
  updated_at = now();

INSERT INTO public."Role" (
  name,
  display_name,
  description,
  is_system,
  is_active,
  is_deleted
)
VALUES (
  'admin',
  'Administrator',
  'Administrative access for normal RBAC and system management.',
  true,
  true,
  false
)
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system = true,
  is_active = true,
  updated_at = now();

WITH upsert_user AS (
  INSERT INTO public."User" (
    email,
    username,
    password_hash,
    first_name,
    last_name,
    display_name,
    employee_id,
    is_active,
    is_deleted,
    tenant_id,
    account_status,
    activated_at,
    created_at,
    updated_at
  )
  VALUES (
    'admin@gp.com',
    'admin',
    '$scrypt$N=32768,r=8,p=1,maxmem=67108864$tKpnL6oSP039Fb1lAtsGmRxE52Q0yNByVPTruoT12xg$kKxEmH016iWEOPOtiI+C+Zt2TzuuqyZExG8rzB3r4Covl8gzY22ZEQ3ujkEJAz9yy0NtJ/eEnQSUQGW1rKUvMA',
    'System',
    'Administrator',
    'System Administrator',
    'GLOBAL-ADMIN',
    true,
    false,
    null,
    'ACTIVE',
    now(),
    now(),
    now()
  )
  ON CONFLICT (email) WHERE is_deleted = false
  DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    employee_id = EXCLUDED.employee_id,
    is_active = true,
    account_status = 'ACTIVE',
    tenant_id = null,
    updated_at = now()
  RETURNING id
), target_roles AS (
  SELECT id FROM public."Role"
  WHERE name IN ('super_admin', 'admin')
    AND is_deleted = false
)
INSERT INTO public."UserRole" (
  user_id,
  role_id,
  assigned_by,
  is_active,
  is_deleted
)
SELECT upsert_user.id, target_roles.id, upsert_user.id, true, false
FROM upsert_user
CROSS JOIN target_roles
ON CONFLICT (user_id, role_id) WHERE is_deleted = false AND is_active = true
DO NOTHING;
