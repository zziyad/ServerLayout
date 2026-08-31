-- Idempotent RBAC seed generated from application/db/rbac_seed.sql
-- Applies permissions, roles, and role-permission mappings on fresh Docker DB.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."User" WHERE email = 'admin@gp.com' AND is_deleted = false) THEN
    RAISE EXCEPTION 'admin@gp.com must be seeded before RBAC role-permission grants';
  END IF;
END $$;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('ade406f5-fe3b-4d91-8656-fe22a7cab8c5', 'permission', 'read', 'List and view permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('0e68918b-9398-4a6a-a8d5-7db774f1e7fc', 'permission', 'create', 'Create new permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('f4cb7c06-dab4-4804-8f7a-72860e86977f', 'permission', 'update', 'Update permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('18796315-e935-49fc-8605-369eb8865691', 'permission', 'delete', 'Delete (soft) permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('e61c58c7-80a6-4064-ab43-ea44d6944f25', 'department', 'read', 'List and view departments', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('c66f714f-dc00-4956-942b-553798c51a63', 'department', 'create', 'Create departments', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('4f371327-3715-4aeb-9f93-6966f2bcf4ac', 'department', 'update', 'Update departments', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('45815f96-15ff-4aef-b574-a93609cf76ad', 'department', 'delete', 'Delete departments', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('8b81e644-b7ca-40b0-bf35-4402ba994855', 'department.role', 'list', 'List roles within a department', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('8f6e0cc8-6e29-4682-9be3-77b7e3329f99', 'department.role', 'create', 'Add role to a department', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('daeff85b-8e18-484f-800b-48ac765e001f', 'department.role', 'update', 'Update department role', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('c374e4cb-ea35-42ec-afe9-75d5b9008aa4', 'department.role', 'delete', 'Remove role from department', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('58891511-1fca-42bb-8fce-ba5e13176548', 'user', 'create', 'Create users', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('5e61e614-9382-4b83-8698-908e901e3fd6', 'user', 'read', 'Read users', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('b9a2d895-ab0b-4f53-815e-a2565b85154e', 'user', 'update', 'Update users', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('096f3278-ee2d-499e-9895-b1c55484fc70', 'user', 'delete', 'Delete users', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('31cf74d8-0315-4371-a9fb-1478ac2ce9de', 'user', 'assign_roles', 'Assign or remove roles on users', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('31e31698-25ff-4378-9a87-c789c11e9427', 'role', 'read', 'List and read roles', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('9c36710e-1de9-42d5-93ed-dd59a370613e', 'role', 'create', 'Create roles', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('fae3cc84-609b-482f-81e9-de1c2f321128', 'role', 'update', 'Update roles', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('0fed907b-59da-4fb1-88da-52dc8478ca43', 'role', 'delete', 'Delete roles', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('adf40fb3-4134-45b3-bbbb-3b8d28e7ff8e', 'role', 'assign_permission', 'Assign permission to role', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('0dae72f5-fdce-4110-b9e6-b462acddc04d', 'role', 'remove_permission', 'Remove permission from role', true, false, NULL, '2026-04-22 01:53:58.310204-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('09fd2d60-4927-48ef-bab8-3b7f8dc7515c', 'gate_pass.approval', 'read', 'Access Gate Pass approval workspace and APIs', true, false, NULL, '2026-04-22 14:07:19.385873-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('b32a25df-8cba-4ee1-98b2-e464de44d5c2', 'gate_pass.security', 'read', 'Access Gate Pass Security workspace and APIs', true, false, NULL, '2026-04-23 10:04:13.382025-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('68846795-3a6b-4cd5-8550-c96f1a5e751b', 'gate_pass.report', 'read', 'Access Gate Pass reports and previews', true, false, NULL, '2026-05-02 05:54:39.953453-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('0ccbb2e8-4bc0-43c8-9a2f-f1bb8ffffbf7', 'gate_pass.report', 'export', 'Export Gate Pass reports', true, false, NULL, '2026-05-02 05:54:39.953453-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('03b5357f-0bdc-4636-9ccd-d425256bf89c', 'gate_pass.admin', 'read', 'Access Gate Pass admin workspace', true, false, NULL, '2026-05-02 07:41:20.92981-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('af1d7db5-6dad-4637-9732-b0c1f70409f5', 'gate_pass.admin', 'write', 'Mutate Gate Pass admin configuration', true, false, NULL, '2026-05-02 07:41:20.92981-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('6cf9af82-9b68-448d-91af-8e1e2e058025', 'gate_pass.dashboard', 'read', 'Access Gate Pass manager dashboard', true, false, NULL, '2026-05-02 18:02:45.950906-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('b9d841f0-6a43-40ad-a738-8b295d95ef79', 'gate_pass.dashboard', 'write', 'Create and update own Gate Pass dashboard widgets', true, false, NULL, '2026-05-02 18:02:45.950906-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('a875335b-201a-4f1a-976b-996a72ec6d17', 'gate_pass.report.template', 'read', 'Read Gate Pass report templates', true, false, NULL, '2026-05-02 18:02:45.950906-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at)
VALUES ('d30f1cc2-c3ff-46be-981e-579f75008f19', 'gate_pass.report.template', 'write', 'Create and update Gate Pass report templates', true, false, NULL, '2026-05-02 18:02:45.950906-04')
ON CONFLICT (resource, action) WHERE is_deleted = false
DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('04d2c81b-d348-4d93-b86b-e775f9b2443b', 'super_admin', 'Super Administrator', 'Full access; bypasses all permission checks.', true, true, false, NULL, '2026-04-21 05:22:16.339853-04', '2026-04-21 05:22:16.339853-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('7cb3bc19-e487-4007-b597-eb39c74fc11b', 'admin', 'Administrator', 'Administrative access for user and system management.', true, true, false, NULL, '2026-04-21 05:22:16.339853-04', '2026-05-02 08:10:14.252103-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('b81b1802-516f-4f34-896e-790025f532b1', 'gate_pass_dashboard_viewer', 'Gate Pass Dashboard Viewer', 'Can view Gate Pass manager dashboard.', true, true, false, NULL, '2026-05-02 18:02:45.950906-04', '2026-05-02 18:02:45.950906-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('435891e9-47b7-4087-9365-3ebd863248a6', 'gate_pass_dashboard_editor', 'Gate Pass Dashboard Editor', 'Can view and customize own Gate Pass manager dashboard.', true, true, false, NULL, '2026-05-02 18:02:45.950906-04', '2026-05-02 18:02:45.950906-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('6e7e47d4-89ae-4ac8-9967-55d082948c88', 'gate_pass_report_designer', 'Gate Pass Report Designer', 'Can view reports and create reusable Gate Pass report templates.', true, true, false, NULL, '2026-05-02 18:02:45.950906-04', '2026-05-02 18:02:45.950906-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('a0bab052-2903-428e-9c6a-23a95c455ae3', 'gate_pass_report_viewer', 'Gate Pass Report Viewer', 'Can view Gate Pass reports and statistics.', true, true, false, NULL, '2026-05-02 18:22:47.971146-04', '2026-05-02 18:22:47.971146-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('135853cb-5bbc-46d2-b57e-6fa6201c8548', 'gate_pass_report_exporter', 'Gate Pass Report Exporter', 'Can view and export Gate Pass reports.', true, true, false, NULL, '2026-05-02 18:22:47.971146-04', '2026-05-02 18:22:47.971146-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('59935b21-7fb7-4119-b449-429189889742', 'security_officer', 'Security Officer', 'Can access Gate Pass security workspace as security officer. Operational assignment remains separate.', true, true, false, NULL, '2026-04-23 10:05:40.70642-04', '2026-05-04 06:53:31.631114-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('f3569ed4-06d9-4b7e-a056-ba445c852dbd', 'gate_pass_approver', 'Gate Pass Approver', 'Can access Gate Pass approval workspace. Workflow actor assignment remains separate.', true, true, false, NULL, '2026-05-02 08:13:39.825535-04', '2026-05-04 06:53:31.631114-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('90d20ade-63f1-42bd-8aff-3a29377750fe', 'security_manager', 'Security Manager', 'Can access Gate Pass security manager workspace. Operational assignment remains separate.', true, true, false, NULL, '2026-05-02 08:14:25.941835-04', '2026-05-04 06:53:31.631114-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('01a470a0-85fb-421e-b356-43e2fdf97ff5', 'security_supervisor', 'Security Supervisor', 'Can access Gate Pass security workspace as security supervisor. Operational assignment remains separate.', true, true, false, NULL, '2026-05-02 08:18:00.563917-04', '2026-05-04 06:53:31.631114-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at)
VALUES ('4c9b4043-8a0c-491a-b379-a7a8a391d925', 'app_user', 'App User', 'Base internal application user role.', true, true, false, NULL, '2026-05-02 18:29:16.245304-04', '2026-05-04 06:53:31.631114-04')
ON CONFLICT (name) WHERE is_deleted = false
DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, is_system = EXCLUDED.is_system, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '3b5190ab-f1e6-4e9d-88af-3974f507c19e', r.id, p.id, admin_user.id, '2026-04-23 10:06:00.848044-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.security' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_officer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '2521c34f-3ec8-4fa1-a7be-e5c8178ba6a1', r.id, p.id, admin_user.id, '2026-05-02 08:20:11.226497-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_approver' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '92f83370-50c0-4509-9775-1072382468a6', r.id, p.id, admin_user.id, '2026-05-02 08:20:11.258183-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_approver' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '3d4cdcc5-247c-4769-839d-b6d5282bbf80', r.id, p.id, admin_user.id, '2026-05-02 08:20:11.273635-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.approval' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_approver' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'c114ec35-c1db-40c0-a0a9-afa8b2fe2fe9', r.id, p.id, admin_user.id, '2026-05-02 08:20:54.16509-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_officer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '8af9c594-a35e-43cb-8778-2bc47f74e255', r.id, p.id, admin_user.id, '2026-05-02 08:20:54.204553-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_officer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '9353480b-4da4-48e4-9a84-ba99067f7891', r.id, p.id, admin_user.id, '2026-05-02 08:21:20.582191-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_supervisor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'ae6136d1-7fd2-4191-9403-18d1cb901f80', r.id, p.id, admin_user.id, '2026-05-02 08:21:20.582635-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_supervisor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '43317a48-1135-4346-8f50-e80ed482f26a', r.id, p.id, admin_user.id, '2026-05-02 08:21:20.586293-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.security' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_supervisor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '13550195-a608-48cb-8ce5-12a5c5f44769', r.id, p.id, admin_user.id, '2026-05-02 08:22:02.715149-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '1f944c04-7b93-4f83-8859-73a62b397577', r.id, p.id, admin_user.id, '2026-05-02 08:22:02.774501-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'export' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'bffbf655-b1f5-4d6c-8fd8-20f4cd3cdd45', r.id, p.id, admin_user.id, '2026-05-02 08:22:02.822919-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '027e649f-db78-4714-94ad-aa6e9ea820fa', r.id, p.id, admin_user.id, '2026-05-02 08:22:02.860547-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.security' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '09e1831c-1cc1-4fcf-87e0-6f032b733790', r.id, p.id, admin_user.id, '2026-05-02 08:22:02.866948-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '1e598a04-b225-4b14-bc44-745c26d63887', r.id, p.id, admin_user.id, '2026-05-02 08:28:44.979696-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department' AND p.action = 'create' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'b6799e65-f6ff-41fd-aa70-41a61e96abcd', r.id, p.id, admin_user.id, '2026-05-02 08:28:44.996486-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department' AND p.action = 'delete' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'badcecce-c418-4483-9861-f3ca9e6bbef1', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.010707-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '7669c4f4-c5a5-49a5-9fa4-72038fe09f90', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.035736-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '31fb10d8-ddf6-49f5-8dc3-0ece02b8476c', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.037422-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department.role' AND p.action = 'create' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '9e2e00c4-e43f-4b8d-920c-73633ac63613', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.045988-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department.role' AND p.action = 'delete' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'c243942a-f97e-43c6-ba3b-3aa19a64066e', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.052611-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department.role' AND p.action = 'list' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'd22e9977-9c7e-4734-bb57-748cf21b5947', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.105318-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.approval' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '4b1e4aca-073e-467d-a1b3-cf950d25d331', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.108341-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '732080cd-8ba9-4026-8af2-8186a4bbc15f', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.11718-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'export' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '6d420539-b5d3-4a94-b85a-d5488fd53bf6', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.12654-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.security' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '513ee9d4-7993-4036-8131-451936a51712', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.151272-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.admin' AND p.action = 'write' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '61530a88-1689-4f49-b236-7ddd1231d602', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.152396-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'department.role' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'c63ed508-72a8-4b07-bdda-b80efd5604e4', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.160643-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.admin' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '6c243e31-f272-4298-af46-11443da7f734', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.16526-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'permission' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'd2159dc3-5300-4a4a-8c93-ef8bdbcce780', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.168797-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'bc857813-c6b4-4376-b8ab-5f4ba330e520', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.181254-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'permission' AND p.action = 'delete' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'b6acc4e9-5b42-4a46-ae81-f2cb3eb1cba8', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.189543-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'e2544085-e27d-4f21-8fce-234bcf74c1de', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.193962-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'permission' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '50ef13b8-894a-4e0e-af7e-0beca97fb5a4', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.196957-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'create' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '6c41148e-442d-4aee-b3d5-5ed328634560', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.213583-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'permission' AND p.action = 'create' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '0f405213-710c-4ae9-bcaa-e3ece4daaf31', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.213858-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'delete' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'a42cd20d-f435-4c7f-878d-b75bdfc3f075', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.215613-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'assign_permission' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'fe5ceeb0-504e-415a-9cc0-daf4691b2186', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.224101-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'create' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '3fd55634-33c4-44db-a9e8-7b80fd25c22d', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.224415-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'assign_roles' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '774975d6-03bb-4d43-955d-2dafc18f8275', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.233012-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '30017785-939a-465b-82e1-b0abd275d381', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.241759-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'delete' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '47bdfb70-28f7-4876-9f8a-7c4d565a9c36', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.246988-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'remove_permission' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'a994db23-1955-42b6-924c-b2f6da67cf57', r.id, p.id, admin_user.id, '2026-05-02 08:28:45.255015-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'role' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'a5e93a2c-3c2a-453d-8bae-d832f08aa7e4', r.id, p.id, admin_user.id, '2026-05-02 08:54:38.460938-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.approval' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'ce086478-15f2-4fc9-8db2-ade43c66aa6f', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_designer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '9ac3bf27-e672-4a43-b0c3-c967d90d1042', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_editor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'fd0a5123-dd8b-455d-9e6b-d9115ba48914', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'export' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_designer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'e4c64ef0-91d5-42fb-87dc-916867f85e79', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '0d6adf2a-9ea3-4b9f-a65a-f54a94fd6352', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_editor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'c21056f5-37ab-4cc0-927d-c6a1e883ce44', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_viewer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'd6bcfdd6-1adc-42a1-bfb7-bc15f88d121a', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'write' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'ef07d7a7-0e1f-4857-898b-e1ca6592d13b', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'write' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_editor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '8921a6a1-4fd0-4ad1-a4bf-ab3c62531b9e', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '01eab7aa-07e8-4bd3-b138-3ef4d6ce8d57', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_designer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '1ed2868c-e4a4-47df-8604-c5d6275ac912', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'write' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'admin' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'a404cac8-4637-4ac2-b2d3-f2172e10f4bc', r.id, p.id, admin_user.id, '2026-05-02 18:02:45.950906-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'write' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_designer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'c41e231b-eb20-4eb5-aac9-e0327123849d', r.id, p.id, admin_user.id, '2026-05-02 18:12:57.305587-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_viewer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '709679df-8c9d-4efb-9faf-9cc63afc2c57', r.id, p.id, admin_user.id, '2026-05-02 18:12:57.305587-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_editor' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '83a6db75-5a40-4b0e-8982-9331a32d8d06', r.id, p.id, admin_user.id, '2026-05-02 18:12:57.305587-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report.template' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_dashboard_viewer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '34dab999-59f0-452e-aaf8-6e2ce18af147', r.id, p.id, admin_user.id, '2026-05-02 18:22:47.971146-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_exporter' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '0c783154-67be-496b-8e11-bef793809796', r.id, p.id, admin_user.id, '2026-05-02 18:22:47.971146-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_viewer' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'b72bffe3-a4b6-4222-9732-fa4334fd1454', r.id, p.id, admin_user.id, '2026-05-02 18:22:47.971146-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.report' AND p.action = 'export' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'gate_pass_report_exporter' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  'cd2db8ce-e233-430a-a033-69d781f3f6f9', r.id, p.id, admin_user.id, '2026-05-02 18:29:16.245304-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'app_user' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '0e6397e8-16f3-40ec-a4e1-07da5c78b145', r.id, p.id, admin_user.id, '2026-05-02 18:29:16.245304-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'user' AND p.action = 'update' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'app_user' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at)
SELECT
  '4501bbc5-753b-49ab-ba59-2fe37496ef9f', r.id, p.id, admin_user.id, '2026-05-02 18:29:16.245304-04', false, NULL
FROM public."Role" r
JOIN public."Permission" p ON p.resource = 'gate_pass.dashboard' AND p.action = 'read' AND p.is_deleted = false
JOIN public."User" admin_user ON admin_user.email = 'admin@gp.com' AND admin_user.is_deleted = false
WHERE r.name = 'security_manager' AND r.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."RolePermission" existing
    WHERE existing.role_id = r.id
      AND existing.permission_id = p.id
      AND existing.is_deleted = false
  );
