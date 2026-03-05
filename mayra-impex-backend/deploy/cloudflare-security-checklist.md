# Cloudflare Security Policy Checklist (API)

> Zone used in examples: `api.example.com`.
> Replace hostname/paths as needed.

## SSL/TLS

- Set SSL mode to **Full (strict)**.
- Enable **Always Use HTTPS**.
- Enable **Automatic HTTPS Rewrites**.
- Minimum TLS version: **1.2**.
- Enable **TLS 1.3**.

## Edge Certificates

- Enable **HSTS** with:
  - `max-age=31536000`
  - `includeSubDomains`
  - `preload` (only after verifying all subdomains are HTTPS)
- Enable **OCSP Stapling**.

## WAF Managed Rules

- Enable Cloudflare **Managed Ruleset**.
- Enable **OWASP Core Ruleset**.
- Deploy in log/simulate mode first, then move to **Block** mode.
- Set managed rules sensitivity to **High** for API origin.
- Enable **Threat Score / IP Reputation** based blocking with Managed Challenge fallback.
- Add geo restrictions for admin surfaces if your ops team is region-bounded.

### Strict Profile Baseline (Production)

- `Security Level`: High
- `Browser Integrity Check`: On
- `Bot Fight Mode`: On
- `Super Bot Fight Mode`: Definitely automated = Block, likely automated = Managed Challenge
- `Rate Limiting`: Enforced in block mode after one-week observation window

## Custom WAF Rules (Copy/Paste Expressions)

Create these under **Security → WAF → Custom rules**.

### Rule 1: Block non-API methods

- **Action:** Block
- **Expression:**

```txt
(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/") and not http.request.method in {"GET" "POST" "PUT" "PATCH" "DELETE" "OPTIONS"})
```

### Rule 2: Block suspicious User-Agent on auth/admin paths

- **Action:** Managed Challenge
- **Expression:**

```txt
(http.host eq "api.example.com" and (starts_with(http.request.uri.path, "/api/auth/") or starts_with(http.request.uri.path, "/api/products") or starts_with(http.request.uri.path, "/api/orders") or starts_with(http.request.uri.path, "/api/inventory") or starts_with(http.request.uri.path, "/api/banners")) and (lower(http.user_agent) contains "sqlmap" or lower(http.user_agent) contains "nikto" or lower(http.user_agent) contains "nmap" or lower(http.user_agent) contains "python-requests" or lower(http.user_agent) contains "curl/"))
```

### Rule 3: Restrict direct access to admin write routes without Authorization header

- **Action:** Block
- **Expression:**

```txt
(http.host eq "api.example.com" and http.request.method in {"POST" "PUT" "PATCH" "DELETE"} and (starts_with(http.request.uri.path, "/api/products") or starts_with(http.request.uri.path, "/api/categories") or starts_with(http.request.uri.path, "/api/orders") or starts_with(http.request.uri.path, "/api/inventory") or starts_with(http.request.uri.path, "/api/banners") or starts_with(http.request.uri.path, "/api/activity") or starts_with(http.request.uri.path, "/api/notes")) and not len(http.request.headers["authorization"]) gt 0)
```

### Rule 4: Block oversized API request body (defense in depth)

- **Action:** Block
- **Expression:**

```txt
(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/") and to_number(http.request.headers["content-length"][0]) gt 10485760)
```

## Custom WAF Rules

- High sensitivity on:
  - `/api/auth/login`
  - `/api/auth/refresh-token`
  - admin write routes (`POST|PUT|PATCH|DELETE` on `/api/products`, `/api/orders`, etc.)
- Challenge/block requests with:
  - abnormal user-agent patterns
  - high 401/403 bursts from same IP
  - impossible geo switch behavior

## Rate Limiting Rules

- `/api/auth/login` and `/api/auth/refresh-token`: strict limits.
- `/api/*` global baseline rate limit.
- Admin write APIs: lower threshold + temporary ban.

Create these under **Security → WAF → Rate limiting rules**.

| Name                | Match expression                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Threshold |   Period | Action            | Mitigation timeout |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------: | -------: | ----------------- | -----------------: |
| Auth Login Strict   | `(http.host eq "api.example.com" and http.request.method eq "POST" and http.request.uri.path eq "/api/auth/login")`                                                                                                                                                                                                                                                                                                                                                                            |        10 | 1 minute | Managed Challenge |         15 minutes |
| Auth Refresh Strict | `(http.host eq "api.example.com" and http.request.method eq "POST" and http.request.uri.path eq "/api/auth/refresh-token")`                                                                                                                                                                                                                                                                                                                                                                    |        20 | 1 minute | Managed Challenge |         10 minutes |
| API Global Burst    | `(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/"))`                                                                                                                                                                                                                                                                                                                                                                                                             |       600 | 1 minute | Managed Challenge |          5 minutes |
| Admin Write Tight   | `(http.host eq "api.example.com" and http.request.method in {"POST" "PUT" "PATCH" "DELETE"} and (starts_with(http.request.uri.path, "/api/products") or starts_with(http.request.uri.path, "/api/categories") or starts_with(http.request.uri.path, "/api/orders") or starts_with(http.request.uri.path, "/api/inventory") or starts_with(http.request.uri.path, "/api/banners") or starts_with(http.request.uri.path, "/api/activity") or starts_with(http.request.uri.path, "/api/notes")))` |       120 | 1 minute | Block             |         10 minutes |

### Required Edge Limits For High-Risk Paths

| Name                 | Match expression                                                                                                                                    | Threshold |   Period | Action            | Mitigation timeout |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------: | -------: | ----------------- | -----------------: |
| Auth Global Strict   | `(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/auth/"))`                                                             |        60 | 1 minute | Managed Challenge |         15 minutes |
| Orders Mutation Edge | `(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/orders") and http.request.method in {"POST" "PUT" "PATCH" "DELETE"})` |        90 | 1 minute | Block             |         10 minutes |
| Admin Surface Edge   | `(http.host eq "api.example.com" and starts_with(http.request.uri.path, "/api/admin/"))`                                                            |        30 | 1 minute | Block             |         15 minutes |

Notes:

- Use `Managed Challenge` first for onboarding period, then switch to `Block` if false positives are low.
- Keep backend Redis limits enabled; edge and origin limits should both run.

## Bot Protection

- Enable **Bot Fight Mode** (or Super Bot Fight Mode if plan supports).
- Challenge likely automated traffic on auth/admin routes.
- Block verified bad bots on all `/api/*` routes.
- Use custom rules to challenge JA3/JA4 fingerprints with abnormal auth bursts.

## DDoS

- Ensure L3/L4 and HTTP DDoS protections are enabled.
- Prepare emergency profile for attack mode (managed challenge).

## Logging & Monitoring

- Enable Logpush/analytics for:
  - WAF events
  - rate limit actions
  - bot detections
- Alert on spikes in:
  - 401/403 rates
  - login attempts
  - admin route write volume
  - WAF block/challenge spikes from a single ASN or country

## Origin Lockdown

- Allow only Cloudflare IP ranges at origin firewall/security group.
- Deny direct public access to Node origin port.
- Keep Redis and database private (no public ingress).

### Origin firewall allow-list steps

1. Allow inbound `80/443` only from Cloudflare IP ranges.
2. Deny all public inbound traffic to `5001`, Redis, and database ports.
3. If using cloud security groups, create a dedicated rule group named `cloudflare-origin-only`.

## Cache Safety

- Do not cache authenticated API responses.
- Cache only safe public endpoints if needed (e.g., static banner reads).

## Recommended Cloudflare Dashboard Toggles

- **Security Level:** Medium or High
- **Bot Fight Mode:** On
- **Browser Integrity Check:** On
- **Under Attack Mode:** Off normally, enable during incidents
- **HTTP/3 (QUIC):** On
- **0-RTT:** Off (to reduce replay risk on sensitive APIs)
