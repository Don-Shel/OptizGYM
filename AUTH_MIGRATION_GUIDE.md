# OptizGYM Authentication Migration & Architecture Guide

This document outlines the migration from Clerk to Neon Auth and describes the modern, secure architecture implemented for OptizGYM.

## 1. Architecture Overview

OptizGYM has migrated from Clerk to **Neon Auth** (built on Better Auth), providing a database-native authentication experience that is fully integrated with our Neon Postgres database.

### Key Components
- **Identity Provider**: Neon Auth OIDC Provider.
- **Backend Verification**: `jose` library using JWKS for stateless JWT validation.
- **Session Management**: SDK-managed sessions with secure `httpOnly` cookie support (configured in Neon Console) and frontend token persistence.
- **Database Integration**: Real-time user synchronization via Neon Webhooks and fail-safe "lazy sync" on login.

## 2. Migration Strategy (Clerk to Neon)

### Phase 1: Analysis & Preparation
- **Legacy State**: Clerk handled all user storage and MFA.
- **Target State**: Neon handles user storage; OptizGYM backend handles RBAC (Role-Based Access Control).
- **Minimal Disruption**: Implemented a "Sync on Login" strategy so users are migrated the first time they sign in to the new system.

### Phase 2: Schema Implementation
- Renamed `clerk_user_id` to `auth_user_id` in [schema.ts](server/src/db/schema.ts).
- Added `role` and `is_email_verified` fields to support native authorization.
- Added `activity_logs` table for security auditing.

### Phase 3: Integration
- Replaced `@clerk/clerk-react` with `@neondatabase/auth` and `@neondatabase/auth-ui`.
- Implemented custom [SignIn](src/pages/auth/SignIn.tsx), [SignUp](src/pages/auth/SignUp.tsx), and [VerifyEmail](src/pages/auth/VerifyEmail.tsx) pages.
- Configured [auth.ts](server/src/middleware/auth.ts) middleware for secure JWT verification.

## 3. Modern Auth Features

### MFA & Social Login
- **MFA**: Supported via TOTP/Email codes (Enable in Neon Console → Auth → MFA).
- **Social Login**: Configured for Google and GitHub (Enable in Neon Console → Auth → Providers).
- **Password Reset**: Fully functional via the `/auth/forgot-password` route.

### Security Hardening
- **JWT Verification**: Uses `jose` with `createRemoteJWKSet` for high-performance, secure validation.
- **Rate Limiting**: Backend protection on sensitive routes using `express-rate-limit`.
- **CSP**: Content Security Policy in [index.ts](server/index.ts) restricts script and connection sources to verified Neon domains.
- **Activity Auditing**: Automatic logging of authentication events in the `activity_logs` table.

## 4. Historical Rollback Note

The original rollback plan referenced Clerk variables and middleware. It is preserved here only as migration history; Clerk is not an active dependency or deployment option in the current repository. A future provider migration would require a deliberate code and schema change, followed by a new migration guide. Do not add `CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY` to the current environment.

## 5. Testing Strategy

### Unit Tests
- Verify token extraction logic in [AuthContext.tsx](src/contexts/AuthContext.tsx).
- Test JWT verification utility in [neon.ts](server/src/utils/neon.ts).

### End-to-End Flows
1. **Registration**: Signup → Verify Email → Auto-redirect to Login.
2. **Authorization**: Accessing `/dashboard` without a token redirects to `/auth/sign-in`.
3. **RBAC**: Accessing `/admin` as a standard user returns a `403 Forbidden`.

## 6. Developer Documentation

### Adding Protected Routes
Wrap your route in the `ProtectedRoute` component in [App.tsx](src/App.tsx):
```tsx
<Route path="/my-path" element={<ProtectedRoute><MyComponent /></ProtectedRoute>} />
```

### Accessing User Data
Use the `useAuth` hook:
```tsx
const { user } = useAuth();
console.log(user.email);
```

### Backend Protection
Apply the `requireAuth` middleware to any Express route:
```ts
router.get('/secure-data', requireAuth, (req, res) => { ... });
```
