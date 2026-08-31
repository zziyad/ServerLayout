-- Imported user activation support (email/password enablement in-place).
-- Adds explicit account status + activation metadata and an audit table.

DO $$ BEGIN
  CREATE TYPE public.user_account_status AS ENUM ('IMPORTED', 'ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS account_status public.user_account_status;

ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS activated_at timestamp with time zone;

ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS activated_by uuid;

DO $$
BEGIN
  ALTER TABLE public."User"
    ADD CONSTRAINT "User_activated_by_fkey"
    FOREIGN KEY (activated_by) REFERENCES public."User"(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE public."User" u
SET account_status = CASE
  WHEN (
    (u.preferences ? 'associatesImport')
    OR (u.email ILIKE 'workforce.%@import.local')
  ) THEN 'IMPORTED'::public.user_account_status
  ELSE 'ACTIVE'::public.user_account_status
END
WHERE u.account_status IS NULL;

ALTER TABLE public."User"
  ALTER COLUMN account_status SET DEFAULT 'ACTIVE'::public.user_account_status;

ALTER TABLE public."User"
  ALTER COLUMN account_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_account_status
  ON public."User"(account_status)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_user_activated_by
  ON public."User"(activated_by)
  WHERE activated_by IS NOT NULL;

CREATE TABLE IF NOT EXISTS public."UserActivationAudit" (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  user_id uuid NOT NULL,
  activated_by uuid,
  previous_email character varying(255),
  new_email character varying(255) NOT NULL,
  previous_username character varying(64),
  new_username character varying(64),
  assigned_role_id uuid,
  assigned_department_role_assignment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  ALTER TABLE public."UserActivationAudit"
    ADD CONSTRAINT "UserActivationAudit_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public."UserActivationAudit"
    ADD CONSTRAINT "UserActivationAudit_activated_by_fkey"
    FOREIGN KEY (activated_by) REFERENCES public."User"(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public."UserActivationAudit"
    ADD CONSTRAINT "UserActivationAudit_assigned_role_id_fkey"
    FOREIGN KEY (assigned_role_id) REFERENCES public."Role"(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public."UserActivationAudit"
    ADD CONSTRAINT "UserActivationAudit_department_role_assignment_id_fkey"
    FOREIGN KEY (assigned_department_role_assignment_id)
    REFERENCES public."DepartmentRoleAssignment"(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_activation_audit_user
  ON public."UserActivationAudit"(user_id, created_at DESC);
