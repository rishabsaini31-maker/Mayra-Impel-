# Production Security Setup Guide

## Certificate Pinning Setup

For production deployment, certificate pinning must be configured to prevent MITM attacks.

### Step 1: Extract Your Certificate Fingerprint

From your server with the SSL certificate:

```bash
# Get SHA-256 certificate fingerprint
openssl s_client -connect yourdomain.com:443 -showcerts 2>/dev/null | \
  openssl x509 -outform der | \
  openssl dgst -sha256

# Or get public key fingerprint (more resilient to cert changes)
openssl s_client -connect yourdomain.com:443 -showcerts 2>/dev/null | \
  openssl x509 -noout -pubkey | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256
```

### Step 2: Update Certificate Pinning Configuration

Edit `mayra-impex-mobile/src/utils/certificatePinning.js`:

Replace the `PLACEHOLDER_SHA256_CERT_FINGERPRINT` and `PLACEHOLDER_SHA256_PUBLIC_KEY_FINGERPRINT` with actual values from Step 1.

```javascript
pinnedCertificates: [
  "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99",
],

pinnedPublicKeys: [
  "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99",
],
```

### Step 3: Enable Certificate Pinning in Production

Certificate pinning is automatically enabled when `NODE_ENV === "production"`.

### Alternative: Using Self-Signed Certificates (Development)

For development with self-signed certificates:

```bash
# Generate self-signed certificate
openssl req -new -x509 -days 365 -nodes -out server.crt -keyout server.key

# Extract fingerprint
openssl x509 -in server.crt -outform der | openssl dgst -sha256
```

---

## Admin PIN Setup (Database)

Make sure the database migration is applied:

```sql
-- Run this migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_set_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_updated_by UUID NULL;

-- Create security_audit_log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20),
  ip_address INET,
  user_agent VARCHAR(500),
  failed_reason VARCHAR(200),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system'
);
```

### Setting Admin PIN

1. **First Time Setup** - Run migration script:

   ```bash
   cd mayra-impex-backend
   node setup-admin-account.js
   ```

2. **Update Admin PIN** - Call API endpoint:
   ```bash
   curl -X POST http://localhost:5001/api/auth/set-admin-pin \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"pin": "1234"}'
   ```

---

## Environment Variables for Production

Add to your `.env` file:

```env
# Certificate Pinning
NODE_ENV=production

# Token Configuration
JWT_SECRET=<strong-random-secret-256+chars>
JWT_REFRESH_SECRET=<strong-random-secret-256+chars>
# Recommended key ring format for overlap rotation
# JWT_ACCESS_KEYS=kidA:secretA,kidB:secretB
# JWT_ACCESS_ACTIVE_KID=kidB
# JWT_REFRESH_KEYS=ridA:secretA,ridB:secretB
# JWT_REFRESH_ACTIVE_KID=ridB
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7
MAX_TOKEN_ROTATIONS=10

# SIEM / Alerting
SECURITY_SIEM_WEBHOOK_URL=<ingest-url>
SECURITY_SIEM_WEBHOOK_TOKEN=<optional-token>
ELK_LOG_INGEST_URL=<elk-ingest-url>
DATADOG_API_KEY=<datadog-api-key>
DATADOG_SITE=datadoghq.com
SENTRY_DSN=<sentry-dsn>

# Rate Limiting
API_RATE_LIMIT=100
API_RATE_WINDOW_MS=900000
AUTH_RATE_LIMIT=10
AUTH_RATE_WINDOW_MS=900000

# Admin PIN Lockout
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
FAILED_LOGIN_DELAY_MS=700

# Replay Protection
REPLAY_WINDOW_MS=120000
NONCE_TTL_MS=300000

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

## Active Attack Monitoring + Alerts (SIEM)

The backend now forwards security events to configured sinks (webhook/ELK/Datadog/Sentry) from `logSecurityEvent`.

### Events forwarded

- `security_audit_log` events
- auth failures and lockouts
- replay detections
- rate-limit hits

### Built-in alert detectors

- `BRUTE_FORCE_SPIKE`
- `OTP_ABUSE`
- `TOKEN_REPLAY_PATTERN`
- `ADMIN_LOGIN_ANOMALY`

Tune thresholds in `mayra-impex-backend/.env`:

```env
ALERT_BRUTE_FORCE_THRESHOLD=8
ALERT_OTP_ABUSE_THRESHOLD=5
ALERT_REPLAY_THRESHOLD=2
ALERT_ADMIN_ANOMALY_THRESHOLD=2
```

Target: alert within minutes using your SIEM notification routing.

## Security CI Gate (must-pass)

Workflow: `.github/workflows/security-gate.yml`

Mandatory checks:

- dependency policy (PR)
- `npm audit --omit=dev --audit-level=high` for backend + mobile
- Semgrep SAST scan
- Gitleaks secret scanning

Block deployment unless all checks pass.

## Secrets + Key Lifecycle Management

### KMS / Vault policy

Store all signing keys and third-party secrets in managed secret storage:

- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault / HashiCorp Vault
- app runtime reads secrets at boot (never commit in repo)

### JWT overlap rotation strategy

1. Add new key pair to `JWT_ACCESS_KEYS` and `JWT_REFRESH_KEYS`.
2. Keep old keys in key ring for overlap window (7-14 days).
3. Set `JWT_ACCESS_ACTIVE_KID` and `JWT_REFRESH_ACTIVE_KID` to new key IDs.
4. After overlap window, remove old keys.

Rotation cadence: every 60-90 days.

### Backup encryption and recovery drills

1. Enable encrypted DB backups at rest.
2. Run monthly restore drill into isolated environment.
3. Measure RTO/RPO and log results.
4. Rotate backup encryption keys at least every 90 days.

---

## Security Audit Logging

All sensitive events are logged to `security_audit_log` table:

- Login attempts (success/failed)
- Admin PIN verification (success/failed)
- Token revocation
- Account lockouts
- Unauthorized access attempts
- Rate limit violations
- Admin actions (create/update/delete products, orders, etc.)

### Query Audit Logs

```sql
-- Recent login failures
SELECT * FROM security_audit_log
WHERE event_type = 'LOGIN' AND status = 'failed'
ORDER BY created_at DESC LIMIT 20;

-- PIN verification failures
SELECT * FROM security_audit_log
WHERE event_type = 'PIN_VERIFY' AND status = 'failed'
ORDER BY created_at DESC LIMIT 20;

-- Suspicious activities (last 24 hours)
SELECT * FROM security_audit_log
WHERE status IN ('failed', 'suspicious')
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## Mobile App Certificate Pinning

### In Development

Certificate pinning is skipped in development (`NODE_ENV !== "production"`). Test with self-signed certificates or run in HTTP mode.

### In Production

1. Configure `certificatePinning.js` with actual certificate/public-key fingerprints.
2. Link a native SSL pinning module for release builds.
3. Build APK/IPA with production environment only (no dev client).
4. App startup fails closed in production if pinning config is invalid.

### Root/Jailbreak Protection

- Integrate JailMonkey (or equivalent native module) in release builds.
- Sensitive API actions are blocked if device integrity checks fail.
- Do not allow production release with missing integrity module.

### Certificate Rotation

When updating SSL certificates:

1. Extract new certificate fingerprint
2. Update `certificatePinning.js`
3. Build and release new app version
4. Maintain old certificate fingerprint for 30 days for backward compatibility

---

## Testing Security Features

### Test Admin PIN

```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Verify admin PIN
curl -X POST http://localhost:5001/api/auth/verify-admin-pin \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-timestamp: $(date +%s%3N)" \
  -H "x-client-nonce: test-nonce-12345" \
  -H "x-request-id: test-request-id" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
```

### Test Token Rotation

```bash
# Get tokens
RESPONSE=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

# Refresh token (should rotate)
curl -X POST http://localhost:5001/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"

# Second refresh with new token should work
NEW_REFRESH=$(curl ... | jq -r '.refreshToken')
```

### Test Rate Limiting

```bash
# Trigger rate limit on auth
for i in {1..15}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"wrong"}'
  echo "Attempt $i"
done
# Should get 429 Too Many Requests after 10 attempts
```

---

## Checklist Before Production

- [ ] Certificate pinning configured with actual certificate fingerprint
- [ ] Admin PIN set up for all admin accounts
- [ ] HTTPS enabled on production server
- [ ] CORS_ALLOWED_ORIGINS configured (not "\*")
- [ ] All secrets in `.env` (never in code)
- [ ] JWT secrets are strong (256+ chars random)
- [ ] Rate limiting tested and appropriate
- [ ] Security audit logs reviewing regularly
- [ ] Backup/disaster recovery plan in place
- [ ] Database backups automated
- [ ] SSL certificate auto-renewal configured
- [ ] Monitoring alerts set up for suspicious activities
- [ ] Security gate workflow required before deploy
- [ ] Key rotation runbook tested in staging
- [ ] Monthly backup restore drill scheduled
