-- Notification email settings — global SMTP configuration for app mail

CREATE TABLE IF NOT EXISTS public.notification_email_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  enabled boolean NOT NULL DEFAULT false,
  provider character varying(50) NOT NULL DEFAULT 'smtp',
  host character varying(255) NOT NULL DEFAULT 'smtp.office365.com',
  port integer NOT NULL DEFAULT 587 CHECK (port > 0 AND port <= 65535),
  secure boolean NOT NULL DEFAULT false,
  tls_reject_unauthorized boolean NOT NULL DEFAULT true,

  username character varying(255) NOT NULL DEFAULT '',
  password_encrypted text,
  from_email character varying(255) NOT NULL DEFAULT '',
  from_name character varying(255) NOT NULL DEFAULT '',

  updated_by uuid REFERENCES public."User"(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO public.notification_email_settings (
  id,
  enabled,
  provider,
  host,
  port,
  secure,
  tls_reject_unauthorized,
  username,
  from_email,
  from_name
)
VALUES (
  1,
  COALESCE(NULLIF(current_setting('app.email_enabled', true), '')::boolean, false),
  'smtp',
  'smtp.office365.com',
  587,
  false,
  true,
  '',
  '',
  'App Notifications'
)
ON CONFLICT (id) DO NOTHING;
