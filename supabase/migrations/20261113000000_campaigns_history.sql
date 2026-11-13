-- Per-campaign history (separate from campaign_sends, which is the daily throttle counter)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  subject       text NOT NULL,
  audience      text,
  segment       text,
  status        text NOT NULL DEFAULT 'sent',
  recipients    integer NOT NULL DEFAULT 0,
  sent_count    integer NOT NULL DEFAULT 0,
  failed_count  integer NOT NULL DEFAULT 0,
  open_rate     numeric NOT NULL DEFAULT 0,
  click_rate    numeric NOT NULL DEFAULT 0,
  sent_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_sent_at_idx
  ON public.campaigns (sent_at DESC NULLS LAST);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Admins / managers read campaign history
CREATE POLICY "authenticated_select_campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (true);

-- Admins / managers can delete entries from history
CREATE POLICY "authenticated_delete_campaigns"
ON public.campaigns FOR DELETE
TO authenticated
USING (true);

-- Writes happen server-side via the service role (bypasses RLS).
