-- DM image messages support
ALTER TABLE direct_messages
  ADD COLUMN IF NOT EXISTS msg_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS view_timer  INT,          -- null=keep, 0=once, N=seconds
  ADD COLUMN IF NOT EXISTS viewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ;
