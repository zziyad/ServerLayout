-- Notification email delivery controls — sandbox redirect and automatic outbox processor

ALTER TABLE public.notification_email_settings
  ADD COLUMN IF NOT EXISTS delivery_mode character varying(30) NOT NULL DEFAULT 'sandbox'
    CHECK (delivery_mode IN ('disabled', 'sandbox', 'production')),
  ADD COLUMN IF NOT EXISTS sandbox_recipient_email character varying(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS auto_process_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_process_interval_seconds integer NOT NULL DEFAULT 60
    CHECK (auto_process_interval_seconds >= 10 AND auto_process_interval_seconds <= 3600),
  ADD COLUMN IF NOT EXISTS auto_process_batch_limit integer NOT NULL DEFAULT 10
    CHECK (auto_process_batch_limit >= 1 AND auto_process_batch_limit <= 100);

UPDATE public.notification_email_settings
SET delivery_mode = COALESCE(NULLIF(delivery_mode, ''), 'sandbox'),
    auto_process_enabled = COALESCE(auto_process_enabled, false),
    auto_process_interval_seconds = COALESCE(auto_process_interval_seconds, 60),
    auto_process_batch_limit = COALESCE(auto_process_batch_limit, 10)
WHERE id = 1;
