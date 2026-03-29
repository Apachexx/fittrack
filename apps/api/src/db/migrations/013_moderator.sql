-- Moderatör rolü
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT FALSE;

-- Sohbet temizleme için silinen_at timestamp
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
