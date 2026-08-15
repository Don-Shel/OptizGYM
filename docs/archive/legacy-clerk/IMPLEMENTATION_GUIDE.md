# Implementation Guide & Fix Resolution

## Overview
This document provides step-by-step procedures to resolve the authentication and profile loading error affecting the delete → re-signin flow.

---

## PART 1: COMPLETED SERVER-SIDE FIXES

### ✅ Fix #1: Clerk Webhook Handler Implementation

**Status**: IMPLEMENTED in `server/index.ts`

**What was added**:
```typescript
// New endpoint: POST /api/webhooks/clerk
// Handles user.deleted event to clean up database records
```

**Critical Environment Setup**:
```env
# Add to .env:
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Get this from:
# 1. Go to https://dashboard.clerk.com/last-active?path=webhooks
# 2. Create new webhook for: https://yourapp.com/api/webhooks/clerk
# 3. Subscribe to: user.deleted, user.created, user.updated
# 4. Copy the signing secret
```

**Installation Required**:
```bash
npm install svix
```

**Database Cleanup Process**:
When user deletes account from Clerk:
1. Webhook payload received with user.deleted event
2. Server looks up member record by clerk_user_id
3. Cascades delete: bookings → workouts → payments → member
4. All user data completely removed from database

**Benefits**:
- Orphaned records prevented
- Clean slate for re-signup
- No data leakage between users

---

### ✅ Fix #2: Improved Member Upsert Logic

**Status**: IMPLEMENTED in `server/index.ts` - POST `/api/members`

**What Changed**:
```sql
-- BEFORE (Incomplete Update):
ON CONFLICT (clerk_user_id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, members.full_name),
  -- ❌ membership_status, expires_at, plan NOT updated

-- AFTER (Complete Reset):
DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, members.full_name),
  plan = EXCLUDED.plan,
  plan_billing = EXCLUDED.plan_billing,
  membership_status = 'pending',
  expires_at = NULL,
  updated_at = NOW()
```

**Impact**:
- New members start with fresh `membership_status = 'pending'`
- Old plan information doesn't carry over
- `expires_at` reset to NULL on re-signup
- Prevents stale data pollution

---

### ✅ Fix #3: Enhanced Error Handling

**Status**: IMPLEMENTED in `server/index.ts` - requireAuth middleware

**Error Response Format**:
```json
{
  "error": "Invalid or expired token",
  "reason": "Token has expired",
  "details": "..." (only in development)
}
```

**Better Logging**:
```
[AUTH] ✓ Token verified for user: user_123
[AUTH] ✗ Token verification failed: token expired
[MEMBER_CREATE] Creating/updating member for clerk_user_id: user_123
[MEMBER_GET_ME] Fetching profile for clerk_user_id: user_123
[CLERK_WEBHOOK] Event: user.deleted for user: user_123
```

Benefits:
- Easier debugging in production logs
- User-friendly error messages
- Support team context (reason field)

---

## PART 2: REMAINING FIXES NEEDED

### ⏳ Fix #4: AuthContext Race Condition Handling

**Status**: MANUAL IMPLEMENTATION REQUIRED

**File**: `src/contexts/AuthContext.tsx`

**Changes Needed** *(since automated file write didn't complete)*:

1. Add imports at top:
```typescript
import { useRef } from "react";
```

2. Add refs after state declarations:
```typescript
const syncPromiseRef = useRef<Promise<void> | null>(null);
const lastSyncClerkIdRef = useRef<string | null>(null);
const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

3. Update `fetchAndSyncUser` to:
   - Check if sync already in progress
   - Prevent duplicate requests
   - Add proper error messaging
   - Reset membership status to "pending"

4. Separate retry logic into its own useEffect

**Why Critical**:
- Prevents race condition on first signin
- Ensures fresh token on each retry
- Validates data before rendering

---

### ⏳ Fix #5: Error Boundary in App Routes

**Status**: NEEDS IMPLEMENTATION

**File**: `src/App.tsx`

**Add Error Boundary Component**:
```typescript
const AuthErrorBoundary = ({ children, showError, error }: {children: React.ReactNode; showError?: boolean; error?: string | null}) => {
  if (showError && error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Unable to Load Profile</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
```

**Update ProtectedRoute**:
```typescript
const ProtectedRoute = ({ children, adminOnly = false }: ...) => {
  const { isSignedIn, isLoaded, user, syncError, isSyncing } = useAuth();
  
  if (!isLoaded) return <LoadingSpinner />;
  if (syncError) return <AuthErrorBoundary showError error={syncError} />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};
```

**Benefits**:
- User sees error instead of infinite spinner
- Retry button available
- Clearer error messaging

---

## PART 3: DATABASE CONSISTENCY CHECKS

###  Post-Fix Verification Queries

After implementing fixes, run these queries:

```sql
-- Check no orphaned records
SELECT COUNT(*) as orphaned_count 
FROM members m 
LEFT JOIN information_schema.tables AS t ON true
WHERE (m.clerk_user_id IS NULL OR m.clerk_user_id = '');

-- Verify cascade deletes work
-- (Delete a test member, verify no orphaned bookings/payments)
DELETE FROM members WHERE id = 'test-id-123';
SELECT COUNT(*) FROM bookings WHERE member_id = 'test-id-123'; -- Should be 0

-- Check membership status distribution
SELECT membership_status, COUNT(*) as count 
FROM members 
GROUP BY membership_status;
```

---

## PART 4: ENVIRONMENT SETUP

### Required .env Variables

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost/optibizgym

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Paystack (existing)
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### Installation Steps

```bash
# 1. Install svix for webhook verification
npm install svix

# 2. Rebuild types
npm run build

# 3. Test server
npm run server

# 4. Run tests
npm run test
```

---

## PART 5: TESTING THE FIX

### Manual Test Procedure

#### Test Case A: Delete → Resignon

```
1. Sign in with email: test@example.com
2. Verify: Profile shows correct name ✓
3. Go to Clerk dashboard
4. Delete the user account
5. Confirm: Database webhooks processed (check server logs)
   Expected log: "[CLERK_WEBHOOK] ✓ Successfully deleted member..."
6. Sign back up with SAME email
7. Verify: Profile is empty/pending (not old data) ✓
8. Verify: Can't book classes (free plan) ✓
9. Purchase Pro plan
10. Verify: Membership active, can book ✓
```

#### Test Case B: Error Recovery

```
1. Sign in
2. In DevTools: Network tab → Throttle to "Slow 3G"
3. Reload page → Should show loading, then error message
4. Click "Retry" button
5. Should eventually connect or show clear error
```

#### Test Case C: Rapid Delete/Resignon

```
1. Delete & resisgnup 3 times rapidly
2. Verify: No mixed data, profile consistent each time
3. Check database: No corrupt records
```

---

## PART 6: ROLLOUT CHECKLIST

Before deploying to production:

- [ ] Webhook secret configured in Clerk dashboard
- [ ] Webhook URL accessible from internet
- [ ] CLERK_WEBHOOK_SECRET added to env
- [ ] svix package installed and tested
- [ ] AuthContext race condition fixes verified
- [ ] Error boundary implemented in App.tsx
- [ ] Database cleanup tested
- [ ] Manual test cases passed
- [ ] Dev team trained on debugging process
- [ ] Support team aware of expected behavior
- [ ] Monitoring alerts set up for webhook failures
- [ ] Database backups verified before deploy

---

## PART 7: MONITORING & ALERTS

### Key Metrics to Track

```
- Webhook success rate: [CLERK_WEBHOOK] ✓ events
- Profile sync failures: [AUTH] ✗ Sync error
- Retry counts: [AUTH] Scheduling retry
- Error responses: 404 from /api/members/me
```

### Suggested Alerts

- Webhook failure rate > 5%
- Auth retry count > 2 (indicates issues)
- Profile creation latency > 2s
- Database connection errors spike

---

## PART 8: ROLLBACK PROCEDURE

If critical issues in production:

```bash
# 1. Disable webhook temporarily
# - Go to Clerk dashboard
# - Disable the /api/webhooks/clerk endpoint

# 2. Revert server code
git revert <commit_hash>
npm run build

# 3. Restart server
systemctl restart optibizgym-server

# 4. Notify users of temporary service
```

---

## References

- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks/overview)
- [Svix Verification Guide](https://docs.svix.com/verifying-payloads/how-webhooks-work)
- [PostgreSQL Cascade Delete](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

**Document Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: READY FOR IMPLEMENTATION
