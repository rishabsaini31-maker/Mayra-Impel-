-- Add admin PIN column to users table for secure password backup authentication
-- PIN will be hashed with bcrypt and only retrievable by admin during setup

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_set_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_updated_by UUID NULL;

-- Add security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20), -- 'success', 'failed', etc.
  ip_address INET,
  user_agent VARCHAR(500),
  failed_reason VARCHAR(200),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system',
  
  -- Indexes for fast queries
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PIN_VERIFY', 'TOKEN_REVOKE',
    'ACCOUNT_LOCK', 'ACCOUNT_UNLOCK', 'ROLE_CHANGE', 'ORDER_CREATE',
    'ORDER_UPDATE', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
    'UNAUTHORIZED_ACCESS', 'RATE_LIMIT', 'SUSPICIOUS_ACTIVITY'
  ))
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_status ON security_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON security_audit_log(ip_address);

-- Add failed 2FA attempts tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_failed_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMP NULL;

-- Add token rotation tracking to user_refresh_tokens table
ALTER TABLE user_refresh_tokens ADD COLUMN IF NOT EXISTS rotation_count INT DEFAULT 0;
ALTER TABLE user_refresh_tokens ADD COLUMN IF NOT EXISTS parent_token_hash VARCHAR(255) NULL;
ALTER TABLE user_refresh_tokens ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMP NULL;

-- Add max rotation limit (e.g., token can be refreshed max 10 times)
ALTER TABLE user_refresh_tokens ADD COLUMN IF NOT EXISTS max_rotations INT DEFAULT 10;

-- Create index for token rotation chain tracking
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_parent ON user_refresh_tokens(parent_token_hash);

