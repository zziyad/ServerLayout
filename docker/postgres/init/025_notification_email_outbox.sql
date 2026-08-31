-- Notification email outbox — durable, retryable email delivery

CREATE TABLE IF NOT EXISTS public.notification_email_outbox (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),

  recipient_user_id uuid
    REFERENCES public."User"(id),

  recipient_email character varying(255) NOT NULL,
  recipient_name character varying(255),

  subject text NOT NULL,
  text_body text NOT NULL,
  html_body text,

  module character varying(100) NOT NULL DEFAULT 'general',
  event_type character varying(100) NOT NULL,
  related_table character varying(100),
  related_id uuid,

  status character varying(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  priority integer NOT NULL DEFAULT 100,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  last_error text,
  provider_message_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_email_outbox_pending
  ON public.notification_email_outbox (status, next_attempt_at, priority, created_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_email_outbox_recipient_created
  ON public.notification_email_outbox (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_email_outbox_related
  ON public.notification_email_outbox (module, event_type, related_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_email_delivery_attempt (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  outbox_id uuid NOT NULL
    REFERENCES public.notification_email_outbox(id)
    ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  status character varying(30) NOT NULL
    CHECK (status IN ('sent', 'failed')),
  provider_response text,
  provider_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_email_attempt_outbox_created
  ON public.notification_email_delivery_attempt (outbox_id, created_at DESC);
