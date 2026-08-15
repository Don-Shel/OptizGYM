# Environment Variables for Registration System

This document lists all environment variables required for the robust user registration flow.

## Database

- `DATABASE_URL` - PostgreSQL connection string (already configured)

## Neon Auth Configuration (Password-Based Registration)

These variables are used to create users in Neon Auth with email and password.

```bash
# Neon Auth API endpoint for creating users
NEON_AUTH_API_URL=https://your-neon-auth-instance.com/api

# API key for Neon Auth - use with Bearer token authentication
NEON_AUTH_API_KEY=sk_neon_xxxxxxxxxxxxxxxxxx
```

## Email Configuration

Email service configuration for sending verification emails. Currently supports SendGrid and Mailgun, or development mode with console logging.

```bash
# Email service provider (sendgrid, mailgun, or development)
EMAIL_SERVICE=development

# SendGrid API Key (if using SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx

# Mailgun configuration (if using Mailgun)
MAILGUN_DOMAIN=mg.example.com
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxx

# Email service fallback API key (generic)
EMAIL_SERVICE_API_KEY=api_key_xxxxxxxxxxxxxxxx
```

## Email Verification

```bash
# Email verification token expiry in hours (default: 24)
# Users must verify their email within this timeframe
EMAIL_VERIFICATION_EXPIRY_HOURS=24

# Frontend URL for sending in verification links
# Verification emails will contain link like: {FRONTEND_URL}/verify-email?token={token}
FRONTEND_URL=http://localhost:8080
```

## Optional: Rate Limiting

```bash
# Rate limit for registration endpoint (requests per hour)
REGISTRATION_RATE_LIMIT_PER_HOUR=20

# Rate limit for email resend (requests per hour per email)
EMAIL_RESEND_RATE_LIMIT_PER_HOUR=5

# Rate limit for verification attempts (requests per hour)
EMAIL_VERIFICATION_RATE_LIMIT_PER_HOUR=10
```

## Optional: Logging

```bash
# Log level for registration service (debug, info, warn, error)
LOG_LEVEL=info

# Enable detailed registration event logging
REGISTRATION_LOGGING_ENABLED=true

# Log sensitive data (passwords hashes, tokens) - only in development
LOG_SENSITIVE_DATA=false
```

## Optional: Webhook Configuration

If using Neon Auth webhooks for automatic member profile sync:

```bash
# Neon Auth webhook signing secret (if using webhooks)
NEON_AUTH_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# Webhook retry configuration
WEBHOOK_RETRY_MAX_ATTEMPTS=3
WEBHOOK_RETRY_DELAY_MS=5000
```

## Node Environment

```bash
# Node environment (development, staging, production)
NODE_ENV=development

# Port for backend server
PORT=3001

# CORS allowed origin
FRONTEND_URL=http://localhost:8080
```

---

## Setup Instructions

### 1. Copy the template

```bash
cp .env.example .env
```

### 2. Update with Neon Auth credentials

Get your Neon Auth API credentials:

1. Go to your Neon Auth dashboard
2. Navigate to Settings → API Keys
3. Generate a new API key with "users:write" permissions
4. Add to `.env`:

```
NEON_AUTH_API_URL=<your-api-url>
NEON_AUTH_API_KEY=<your-api-key>
```

### 3. Configure Email Service

**Option A: Development (Console Only)**

```
EMAIL_SERVICE=development
```

In dev mode, verification tokens are logged to console instead of emailed.

**Option B: SendGrid**

1. Create SendGrid account at sendgrid.com
2. Generate API key in Settings → API Keys
3. Add to `.env`:

```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=<your-sendgrid-key>
FRONTEND_URL=https://yourdomain.com
```

**Option C: Mailgun**

1. Create Mailgun account at mailgun.com
2. Get API key and domain from Account Settings
3. Add to `.env`:

```
EMAIL_SERVICE=mailgun
MAILGUN_DOMAIN=<your-mg-domain.com>
MAILGUN_API_KEY=<your-mailgun-key>
FRONTEND_URL=https://yourdomain.com
```

### 4. Update Frontend URL

```
FRONTEND_URL=https://yourdomain.com  # Production
FRONTEND_URL=http://localhost:8080   # Development
```

### 5. Test the configuration

```bash
# Backend starts successfully
npm run server

# Test registration endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "confirmPassword": "TestPassword123",
    "fullName": "Test User"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "authUserId": "neon_user_xxx",
#     "memberId": "uuid_xxx",
#     "email": "test@example.com",
#     "verificationTokenExpiry": "2026-04-19T...",
#     "message": "Registration successful. Please verify your email."
#   }
# }
```

---

## Security Considerations

### Passwords

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Maximum 128 characters (protection against ReDoS attacks)

### Email Verification Tokens

- Generated using crypto.randomBytes(32)
- 64-character hex string (cryptographically secure)
- Stored in database with expiry timestamp
- Single-use only (cleared after successful verification)
- Automatically expire after configured hours

### API Keys

- Never commit `.env` to version control
- Use separate API keys for each environment (dev, staging, prod)
- Rotate API keys regularly
- Use environment-specific SendGrid/Mailgun sub-accounts when possible

### Rate Limiting

Implement rate limiting on:
- `/api/auth/register` - 20 requests/hour per IP
- `/api/auth/resend-verification` - 5 requests/hour per email
- `/api/auth/verify-email` - 10 requests/hour per user

---

## Troubleshooting

### "Email verification token not configured"

```
NEON_AUTH_API_URL and NEON_AUTH_API_KEY are not set in .env
```

Solution: Add these variables to your `.env` file

### "Failed to create authentication account"

```
Neon Auth API is not responding or credentials are invalid
```

Solution:
- Verify NEON_AUTH_API_URL is correct
- Check that API key has "users:write" permission
- Test with curl: `curl -H "Authorization: Bearer $KEY" $URL/users`

### "Email verification service not configured"

```
EMAIL_SERVICE is not set in .env
```

Solution: Set `EMAIL_SERVICE=development` for local testing, or configure SendGrid/Mailgun

### "Verification email not sent"

In development mode:

```bash
# Check backend logs for verification token
npm run server | grep -i "verification"
```

Token will be logged to console. Copy and use in URL:

```
http://localhost:8080/verify-email?token=<token>
```

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables are set in production environment (not in `.env` file)
- [ ] Neon Auth API URL and key are from production account
- [ ] Email service is configured (SendGrid/Mailgun) with production API keys
- [ ] FRONTEND_URL points to production domain
- [ ] Email verification token expiry is set appropriately (24h is default)
- [ ] Rate limiting is enabled
- [ ] Database has backup configured
- [ ] CORS_ORIGIN is set to production domain only
- [ ] NODE_ENV=production
- [ ] LOG_LEVEL=info (or higher) - not debug
- [ ] LOG_SENSITIVE_DATA=false

---

## Monitoring

Monitor these metrics for registration health:

```
GET /api/system/health/registration?token=<admin-jwt>
```

Response includes:
- Orphaned member records count
- Stale unverified users (>24h)
- Recent registration failures
- Expired verification tokens

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for full flow documentation.
