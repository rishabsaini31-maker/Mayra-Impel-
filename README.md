# Mayra Impex Platform

Production-ready B2B wholesale ordering platform with:

- React Native mobile app (Admin + Customer)
- Node.js/Express backend
- PostgreSQL (Supabase/Neon style)
- Redis-backed security controls
- No online payment gateway (order-request model)

---

## Executive Summary

- **What this is:** A production-ready B2B wholesale ordering platform (mobile + backend).
- **Business model:** Order-request workflow only (no online payment gateway).
- **Who uses it:** Customers place bulk order requests; Admins manage products, categories, customers, inventory, and order approvals.
- **Security posture:** Layered controls across mobile, API, database, and edge (Redis rate limits, replay protection, token revocation, strict admin authorization, TLS/WAF hardening guidance).
- **Operational readiness:** Includes deployment hardening artifacts for Nginx and Cloudflare, environment templates, and migration scripts.

### Go-Live Readiness (High-Level)

- **Application:** ✅ Role-based mobile app + backend APIs in place
- **Security controls:** ✅ Implemented at app/API level, edge checklist provided
- **Infrastructure dependencies:** ⚠️ Requires production Redis, TLS certs, and Cloudflare policies configured
- **Database migrations:** ⚠️ Ensure all security migrations are executed in production before launch

---

## 1) Architecture

### Monorepo Structure

```text
Mayra Impex/
├── mayra-impex-backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── deploy/
│   │   ├── nginx/
│   │   └── cloudflare-security-checklist.md
│   ├── database-schema.sql
│   ├── add-security-hardening.sql
│   ├── add-token-revocation.sql
│   └── .env.example
├── mayra-impex-mobile/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── store/
│   │   └── utils/
│   └── .env.example
└── README.md
```

---

## 2) Core Product Features

### Customer Panel

- Register, login, profile management
- Browse categories and products
- Product detail and cart flow
- Place order request (no payment flow)
- View order history and order details
- Home slider/banner visibility

### Admin Panel

- Dashboard analytics/stats
- Customer management (list, block/unblock, segments, exports)
- Product management (create/update/archive, image upload)
- Category management
- Order management (status updates, bulk status, exports)
- Inventory operations
- Notes/activity management
- Slider/banner management

---

## 3) Security Implemented

### Authentication & Authorization

- Bcrypt password hashing
- JWT access token (short TTL via env)
- Refresh token flow with secure rotation
- Role-based access (admin/customer)
- `verifyToken` + `verifyAdmin` middleware
- Account lockout after repeated failed attempts
- Delayed failed-login responses (anti-bruteforce timing defense)

### Token Security

- Refresh tokens stored hashed in DB
- Token revocation support via `token_version`
- Admin critical routes validate live DB user state
- Blocked/deleted admin cannot execute sensitive actions

### API Security

- Redis-backed distributed rate limiting
  - Global API rate limits
  - Stricter auth route limits
  - Admin write-route throttling
- Replay protection middleware
  - Nonce + timestamp checks
  - Duplicate nonce rejection (Redis-backed)
- Joi validation for request payloads
- Request sanitization middleware

### Headers / Transport / Edge

- Helmet security headers
- HSTS + HTTPS redirect behavior in production
- Strict CORS allowlist
- Hardened Nginx reverse-proxy config
- Cloudflare WAF + rate-limit checklist

### Mobile Security

- Tokens stored in SecureStore (not plain AsyncStorage)
- Persist only minimal user metadata locally
- Inactivity auto-logout
- Biometric re-auth for admin session unlock
- Screenshot/privacy protections for sensitive admin context
- API URL from environment variable (no hardcoded production secret values)

---

## 4) Security Files Added

### Backend Security Files

- `src/middleware/auth.middleware.js`
- `src/middleware/security.middleware.js`
- `src/middleware/replay.middleware.js`
- `src/middleware/redis-rate-limit.middleware.js`
- `src/middleware/error.middleware.js`
- `src/services/auth.service.js`
- `src/config/redis.js`
- `src/utils/env.js`
- `add-security-hardening.sql`
- `add-token-revocation.sql`
- `deploy/nginx/mayra-impex-api.conf`
- `deploy/cloudflare-security-checklist.md`

### Mobile Security Files

- `src/utils/authStorage.js`
- `src/api/client.js`
- `src/store/authStore.js`
- `src/navigation/AppNavigator.js`

---

## 5) Services Layer (Backend)

- `email.service.js`: transactional and export emails
- `whatsapp.service.js`: WhatsApp notifications
- `pdf.service.js`: order PDF generation
- `auth.service.js`: token creation/rotation/cookie helpers

---

## 6) Components & App Layers (Mobile)

### Reusable Components

- Product cards, category cards, search bar, cart toast, button/input primitives
- Admin feature widgets (filters, export controls, segments, notes modal)

### App Layers

- `api/`: centralized API client + interceptors
- `navigation/`: role-based stacks/tabs
- `store/`: auth/cart state (Zustand)
- `screens/`: admin/customer/auth flows
- `utils/`: secure auth storage helpers

---

## 7) Environment Configuration

### Backend (`mayra-impex-backend/.env`)

Must include secure values for:

- JWT and refresh secrets
- Supabase connection keys
- Redis URL
- CORS allowed origins
- auth/replay/rate limit tuning values

Use `mayra-impex-backend/.env.example` as template.

### Mobile (`mayra-impex-mobile/.env`)

Use only public runtime config:

- `EXPO_PUBLIC_API_URL`

Never put JWT secrets, DB URLs, private API keys in mobile env.

---

## 8) Database Requirements

Run these scripts in DB:

- `database-schema.sql`
- `add-security-hardening.sql`
- `add-token-revocation.sql`
- feature scripts already included for banners/SKU/etc.

---

## 9) Deployment & Edge Security

Use these production docs/configs:

- `DEPLOYMENT.md`
- `mayra-impex-backend/deploy/nginx/mayra-impex-api.conf`
- `mayra-impex-backend/deploy/cloudflare-security-checklist.md`

Recommended baseline:

- Cloudflare SSL mode: Full (strict)
- TLS 1.2+ / TLS 1.3
- Managed WAF + OWASP rules
- Route-specific edge rate limits
- Origin lockdown to Cloudflare IPs only

---

## 10) Current Known Security Scope

### Covered

- Auth hardening, replay protection, distributed rate limiting, token revocation, admin route protection, mobile secure storage, edge hardening docs.

### Optional Next Enhancements

- Device attestation (Play Integrity / App Attest)
- Strong certificate pinning in native/bare build
- SIEM integration + alert pipelines
- Redis HA setup (sentinel/cluster) for high availability

---

## 11) Quick Start

### Backend

```bash
cd mayra-impex-backend
npm install
cp .env.example .env
npm start
```

### Mobile

```bash
cd mayra-impex-mobile
npm install
cp .env.example .env
npm start
```

---

## 12) Important Note

No application is 100% attack-proof. This platform uses layered defense (app + API + DB + edge) to reduce risk, limit blast radius, and improve detection/response.
# Mayra-Impex
