-- 2FA/OTP Recovery System
-- Allows users to recover account access via SMS OTP when biometric/PIN fails

-- Add phone number and 2FA setup to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_requested_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_locked_until TIMESTAMP;

-- Create OTP sessions table
CREATE TABLE IF NOT EXISTS otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  verified_by_ip INET,
  created_by_ip INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attempts_remaining INT DEFAULT 3,
  
  CONSTRAINT otp_not_expired CHECK (expires_at > CURRENT_TIMESTAMP)
);

-- Create indexes for OTP queries
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON otp_sessions(verified_at);

-- PII Field Encryption (Supabase pgcrypto - requires initialization)
-- Encrypted fields table to hold encrypted values
CREATE TABLE IF NOT EXISTS encrypted_pii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  encrypted_name BYTEA,
  encrypted_phone BYTEA,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encrypted_pii_user ON encrypted_pii(user_id);

-- GDPR Data Deletion Request Tracking
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_scheduled_at TIMESTAMP,
  deleted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, cancelled, completed
  reason VARCHAR(500),
  ip_address INET,
  
  CONSTRAINT valid_deletion_status CHECK (status IN ('pending', 'cancelled', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_user ON gdpr_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_status ON gdpr_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_scheduled ON gdpr_deletion_requests(deletion_scheduled_at);

-- 30-day grace period for deletion requests
CREATE OR REPLACE FUNCTION auto_process_gdpr_deletion()
RETURNS void AS $$
DECLARE
  deletion_row gdpr_deletion_requests%rowtype;
BEGIN
  FOR deletion_row IN (
    SELECT * FROM gdpr_deletion_requests 
    WHERE status = 'pending' 
    AND deletion_scheduled_at <= NOW()
    FOR UPDATE
  ) LOOP
    -- Hard delete user and related data
    DELETE FROM users WHERE id = deletion_row.user_id;
    
    -- Update deletion status
    UPDATE gdpr_deletion_requests 
    SET status = 'completed', deleted_at = NOW()
    WHERE id = deletion_row.id;
    
    -- Log deletion
    INSERT INTO security_audit_log (user_id, event_type, action, description, status, created_by)
    VALUES (deletion_row.user_id, 'GDPR_DELETE', 'USER_DELETED', 'User account permanently deleted per GDPR request', 'success', 'system');
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- Trigger to scan for GDPR deletions (run daily via cron)
-- SELECT cron.schedule('gdpr-deletion-processor', '0 0 * * *', 'SELECT auto_process_gdpr_deletion()');
