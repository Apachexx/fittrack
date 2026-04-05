-- Store DM images in DB (persists across Railway deploys)
CREATE TABLE IF NOT EXISTS dm_image_blobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_dm_image_blobs_created ON dm_image_blobs(created_at);
