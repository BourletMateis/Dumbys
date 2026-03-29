-- 018_notification_crons.sql
-- Supabase Edge Function cron schedules for push notifications
--
-- Prerequisites:
--   1. pg_cron extension must be enabled (Supabase Cloud: enabled by default)
--   2. pg_net extension must be enabled (Supabase Cloud: enabled by default)
--   3. Set the following in your Supabase project settings (or via the Dashboard):
--        app.supabase_url  → your project URL (e.g. https://xxx.supabase.co)
--        app.service_role_key → your service role key
--
-- Alternative: configure these crons via the Supabase Dashboard under
--   "Database → Extensions → pg_cron" or "Edge Functions → Scheduled functions".

-- Enable extensions (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Saturday 9:00 AM UTC — Vote reminder ─────────────────────────
DO $$
BEGIN
  PERFORM cron.unschedule('notify-vote-reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'notify-vote-reminder',
  '0 9 * * 6',
  $cmd$
  SELECT net.http_post(
    url        := current_setting('app.supabase_url') || '/functions/v1/notify-vote-reminder',
    headers    := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.service_role_key')
                  ),
    body       := '{}'::jsonb
  );
  $cmd$
);

-- ── Monday 10:00 AM UTC — Podium results ──────────────────────────
DO $$
BEGIN
  PERFORM cron.unschedule('notify-podium');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'notify-podium',
  '0 10 * * 1',
  $cmd$
  SELECT net.http_post(
    url        := current_setting('app.supabase_url') || '/functions/v1/notify-podium',
    headers    := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.service_role_key')
                  ),
    body       := '{}'::jsonb
  );
  $cmd$
);
