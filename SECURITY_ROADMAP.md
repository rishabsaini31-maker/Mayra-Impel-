# Security Implementation Roadmap

## ✅ COMPLETED - Production Ready (Phase 1)
- [x] Bcrypt password hashing (12 salt rounds)
- [x] Admin PIN moved to database with secure verification API
- [x] JWT with 15-min access token expiry
- [x] Refresh token rotation with max 10 rotations per session
- [x] Rate limiting (auth: 10/15min, API: 100/15min via Redis)
- [x] Replay attack protection (nonce + timestamp validation)
- [x] Account lockout (5 failed attempts → 15 min lockout)
- [x] Error handling (no debug info in production)
- [x] Security audit logging table (all events tracked)
- [x] Certificate pinning framework for mobile
- [x] CORS whitelist validation (not "*")
- [x] HTTPS enforcement (HTTP redirect in production)
- [x] Secure cookie settings (httpOnly, secure, sameSite)
- [x] Input sanitization (control characters removed)
- [x] Admin biometric + PIN dual authentication
- [x] Session timeout with auto-logout

---

## 🟠 HIGH PRIORITY (Week 1 - Before Full Production)

### 8️⃣ Add 2FA/SMS OTP Backup Authentication
**Rationale:** If mobile device is lost or stolen, admin can still regain access

**Implementation Scope (1-2 hours):**
```
Backend Changes:
✓ Add phone_number field to users table
✓ Create otp_sessions table (OTP, exp_time, attempts)
✓ POST /auth/request-recovery-otp → Generate OTP via Twilio SMS
✓ POST /auth/verify-recovery-otp → Validate OTP, issue tokens
✓ Add 2FA settings to user preferences

Mobile Changes:
✓ Phone number verification screen
✓ OTP input screen (auto-fill from SMS)
✓ Enable/Disable 2FA toggle in settings
✓ Recovery flow when biometric/PIN fails

Fallback Flow:
1. User can't use biometric → Try PIN
2. User can't remember PIN → Request SMS OTP
3. OTP sent to registered phone → Verify → Access granted
```

**Risk Mitigation:**
- OTP valid for only 5 minutes
- Max 3 attempts per OTP
- Rate limit: 1 OTP request per minute

---

### 9️⃣ PII Field Encryption at Rest

**Rationale:** GDPR compliance - if database is breached, sensitive data remains encrypted

**Implementation Scope (2-3 hours):**
```
Sensitive Fields to Encrypt:
- users.name
- users.email (already has privacy checks)
- users.phone
- orders.delivery_address
- orders.shop_name
- orders.delivery_name

Approach: Use Supabase pgcrypto extension
- Native PostgreSQL encryption
- Transparent to application (handled via database views)
- Can search encrypted fields with proper functions
- Performance impact: negligible for OLTP

Implementation Steps:
1. Create encryption key in Supabase
2. Create encrypted columns alongside originals
3. Create database trigger to encrypt on insert/update
4. Update SELECT queries to decrypt (via views)
5. Migrate existing data (background job)
6. Drop unencrypted columns after validation

SQL Example:
CREATE COLUMN members.encrypted_name bytea;
CREATE TRIGGER encrypt_name_trigger
BEFORE INSERT ON members FOR EACH ROW
EXECUTE FUNCTION pgp_sym_encrypt(NEW.name, 'key'::bytea);

-- Query decrypted data
SELECT id, pgp_sym_decrypt(encrypted_name, 'key'::bytea) as name
FROM members;
```

**Risk Mitigation:**
- Master key stored in Supabase vault
- Automatic backups include encrypted data (safe)
- No app code changes needed (transparent)

---

### 1️⃣0️⃣ GDPR Data Deletion Endpoint

**Rationale:** Legal requirement - "Right to be Forgotten" under GDPR Article 17

**Implementation Scope (1-2 hours):**
```
Endpoint: DELETE /api/auth/delete-account
Requires: Password + Fresh SMS OTP (double confirmation)

Delete (Hard):
- User record
- Refresh tokens
- API keys
- User sessions
- Profile data

Keep But Anonymize (For analytics):
- Order records (amount, date, but no customer info)
- Transaction logs
- Audit logs (anonymized user reference)

Response:
{
  "success": true,
  "message": "Account deletion scheduled",
  "completionDate": "2026-03-20T19:38:00Z",
  "dataRetention": "Orders kept for 7 years per tax law (anonymized)"
}

Compliance:
- Deletes all identifiable data within 30 days
- Keeps transaction records per accounting requirements
- Provides deletion confirmation
- Cannot restore account after 30 days
```

**Risk Mitigation:**
- Request requires both password AND OTP (prevents accidental deletion)
- 24-hour grace period (user can cancel)
- Audit log of deletion request created

---

## 🟡 MEDIUM PRIORITY (Month 1 - Compliance & Monitoring)

### 1️⃣1️⃣ Advanced Security Monitoring

**Implement:**
- Dashboard showing failed login attempts
- Alert system for suspicious activities
- IP-based anomaly detection
- Device fingerprinting for new login locations
- Email notifications for admin actions

---

### 1️⃣2️⃣ Request/Response Logging for Debugging

**Do NOT Log:**
- Passwords
- Credit card numbers
- PII in request body
- Authorization tokens

**DO Log:**
- API endpoint
- Response status
- Execution time
- User ID (anonymized)
- Request/response size

---

## 🔵 FUTURE ENHANCEMENTS (Month 2+)

- [ ] Hardware security key support (U2F/FIDO2)
- [ ] IP whitelist per admin user
- [ ] Encryption key rotation schedule
- [ ] Rate limiting by API endpoint (not global)
- [ ] GraphQL API with field-level security
- [ ] Zero-knowledge proof authentication
- [ ] Decentralized identity (DID) support

---

## Testing & Validation

### Manual Testing Commands

```bash
# 1. Test Admin PIN
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass"}' \
  | jq -r '.token')

curl http://localhost:5001/api/auth/verify-admin-pin \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"pin":"1234"}'

# 2. Test Rate Limiting
for i in {1..15}; do
  curl http://localhost:5001/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}' &
done; wait

# 3. Test Token Rotation
curl http://localhost:5001/api/auth/refresh-token \
  -d '{"refreshToken":"YOUR_TOKEN"}'

# 4. Check Audit Logs
psql -d mayra_impex -c "SELECT * FROM security_audit_log LIMIT 20;"
```

### Automated Tests

```javascript
// Security test suite
describe('Security', () => {
  test('Rate limiting enforced on /auth/loop', async () => {
    for (let i=0; i<15; i++) {
      const res = await POST('/auth/login');
      if (i < 10) expect(res.status).toBe(401);
      if (i >= 10) expect(res.status).toBe(429);
    }
  });

  test('Admin PIN verified against database', async () => {
    const res = await POST('/auth/verify-admin-pin', {pin: '1234'});
    expect(res.status).toBe(200);
  });

  test('Replay protection blocks duplicate requests', async () => {
    const nonce = 'test-nonce-123';
    const res1 = await POST('/orders', {...}, {headers: {'x-client-nonce': nonce}});
    const res2 = await POST('/orders', {...}, {headers: {'x-client-nonce': nonce}});
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(400);
  });
});
```

---

## Timeline Recommendations

### Week 1 (This Week)
- Implement 2FA/SMS OTP
- Set up PII field encryption
- Create GDPR deletion endpoint
- Deploy to production

### Week 2
- Set up security monitoring dashboard
- Test with penetration testing scenarios
- Review audit logs
- Document incident response procedures

### Week 3-4
- User acceptance testing with full security features
- Train customer support on security procedures
- Set up automated compliance reporting

---

## Production Readiness Checklist

- [x] All critical security issues fixed
- [x] Audit logging in place
- [x] Rate limiting configured
- [x] Certificate pinning framework ready
- [ ] 2FA/SMS OTP implemented
- [ ] PII encryption deployed
- [ ] GDPR deletion endpoint working
- [ ] Monitoring dashboard live
- [ ] Incident response plan documented
- [ ] Backup/recovery tested
- [ ] SSL certificate auto-renewal configured
- [ ] Admin team trained on security procedures

---

## Security Contacts

**For Security Issues:** security@mayra-impex.com  
**Incident Response:** 24/7 on-call team  
**Compliance Officer:** compliance@mayra-impex.com

---

**Last Updated:** March 5, 2026  
**Next Review:** March 12, 2026
