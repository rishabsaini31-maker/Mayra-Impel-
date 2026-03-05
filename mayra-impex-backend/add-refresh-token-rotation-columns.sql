-- Add refresh-token rotation tracking columns expected by auth.service.js

ALTER TABLE user_refresh_tokens
ADD COLUMN IF NOT EXISTS parent_token_hash TEXT,
ADD COLUMN IF NOT EXISTS rotation_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_rotations INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_parent_hash
  ON user_refresh_tokens(parent_token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_rotation
  ON user_refresh_tokens(user_id, rotation_count);
