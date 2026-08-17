# OptizGYM Product Requirements Document

**Document status:** Implementation baseline and roadmap  
**Product:** OptizGYM gym management platform  
**Primary audience:** Product, engineering, operations, gym administrators, trainers, and implementation partners  
**Last updated:** 17 August 2026

## 1. Executive Summary

OptizGYM is a production-oriented gym management platform that connects public fitness discovery, member self-service, trainer-led programming, class booking, membership payments, notifications, and administrator operations in one web application. The platform is designed around a split deployment topology: a React/Vite frontend is served from Vercel, while an Express/Drizzle API, Socket.IO realtime service, and scheduled or webhook-driven integrations run on Render against Neon PostgreSQL and Neon Auth.

The product’s central objective is to make gym operations visible and actionable in real time. Members should be able to discover classes and trainers, purchase a membership, book eligible classes, monitor payments, and receive timely notifications. Administrators should be able to manage the member lifecycle, classes, trainers, payments, and operational statistics without direct database edits. Public visitors should see current classes and trainer profiles before registration. All clients should gracefully fall back to normal API refetching when a realtime connection is unavailable.

> **Product principle:** A database change is not complete until the affected users can see the resulting state in the interface without manually refreshing the page.

## 2. Product Goals and Non-Goals

### 2.1 Goals

| Goal | Product outcome | Measurement direction |
|---|---|---|
| Increase conversion from visitor to member | Visitors can browse current classes, trainers, pricing, and booking prerequisites before registration | Public discovery engagement, registration conversion |
| Reduce administrative database work | Admins can manage member profiles, status, plans, classes, trainers, payments, and notifications from the dashboard | Reduction in manual database interventions |
| Keep every view operationally current | Changes propagate through Socket.IO and trigger targeted React Query invalidation | Realtime event-to-UI latency and connection success rate |
| Protect member and payment data | Role checks, authenticated API requests, validated payloads, safe event payloads, and verified webhooks protect sensitive operations | Unauthorized request rate and security test results |
| Support reliable payments and access control | Paystack verification controls membership activation and class eligibility | Successful payment verification and booking integrity |

### 2.2 Non-goals for the current release

The current release does not create Neon Auth accounts from the gym admin panel, replace Paystack checkout, provide a native mobile application, or offer a fully autonomous trainer payroll or scheduling system. Admin profile creation links an existing Neon Auth user to a member profile; account creation remains owned by Neon Auth.

## 3. Personas and Roles

### 3.1 Visitor

A visitor is an unauthenticated person exploring OptizGYM. Visitors can view the landing page, current classes, public trainer profiles, pricing, class details, trainer specialties, schedules, duration, location, intensity, requirements, and public calls to action. Visitors cannot access member data, private bookings, payments, or administrator operations.

### 3.2 Member

A member is an authenticated Neon Auth user with a corresponding member profile. Members can manage their profile, view membership status and payment history, browse and book eligible classes, cancel their own bookings, view progress, receive notifications, and access trainer and class discovery experiences. Class booking requires an active paid plan according to the current eligibility rules.

### 3.3 Trainer

A trainer is a public-facing instructor profile managed by an administrator. The current system models trainer records separately from member accounts. Trainers are represented by name, email, specialty, bio, and optional avatar URL. Trainer records can be associated with classes and are surfaced through public discovery and booking flows.

### 3.4 Administrator

An administrator is an authenticated member with the `admin` role. Administrators can view operational statistics, manage member profiles and statuses, activate or suspend access, manage classes and trainers, review payments, send or trigger notifications, and monitor live changes through the admin dashboard. Admin-only API routes enforce authorization on the server; frontend route guards are an additional user-experience layer, not the security boundary.

## 4. Core User Journeys

### 4.1 Visitor discovery and conversion

A visitor lands on the public site, sees a live feed of upcoming classes and trainer profiles, filters or searches offerings, opens detailed class or trainer information, reviews membership options, and chooses either registration or a membership path. Public class and trainer content is refreshed when the API emits a corresponding realtime resource event.

### 4.2 Registration and profile synchronization

A user creates an account through Neon Auth, verifies their email when required, and signs in. Neon Auth webhook or frontend synchronization creates or updates the corresponding member profile. The dashboard loads the profile from the API using a verified bearer token. Member-created or member-updated events notify connected administrative views without exposing the member’s private fields through the event payload.

### 4.3 Membership payment and activation

A member chooses a plan and billing cycle, completes Paystack checkout, and the API verifies the transaction server-side. A successful verification records the payment, updates the plan and expiry date, activates membership, creates a notification, and broadcasts payment and member-activation events. Member pages refresh membership, payment, and eligibility queries immediately.

### 4.4 Class booking and cancellation

An eligible member selects a class, submits a booking, and the API performs membership, capacity, duplicate-booking, and ownership checks inside the booking workflow. On success, class enrollment and booking data are updated, the member receives a private confirmation, and all clients receive safe class-capacity and booking resource events. Cancellation reverses enrollment and follows the same realtime path.

### 4.5 Administrator member management

An administrator opens `/admin/members`, searches or filters the roster, opens the action menu, and views or edits a member profile. The administrator can create a profile for an existing Neon Auth user, update plan or role fields, activate or suspend access, and soft-delete the profile. The list, statistics, member detail panel, and other connected clients reflect the change without a manual reload.

## 5. Functional Requirements

### 5.1 Public discovery

| ID | Requirement | Priority |
|---|---|---|
| PUB-01 | Display current, non-deleted classes with schedule, duration, capacity, category, location, difficulty, intensity, requirements, and trainer information | Must |
| PUB-02 | Display active trainer profiles with name, specialty, bio, avatar, and associated upcoming classes | Must |
| PUB-03 | Provide search and filtering for classes and trainers | Should |
| PUB-04 | Show membership and payment prerequisites before a user attempts to book | Must |
| PUB-05 | Refresh class and trainer data after realtime resource events without a full page reload | Must |

### 5.2 Authentication and member access

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Use Neon Auth for registration, email verification, sign-in, token issuance, and sign-out | Must |
| AUTH-02 | Synchronize verified identity fields from Neon Auth to the member profile | Must |
| AUTH-03 | Protect member API routes with verified bearer tokens | Must |
| AUTH-04 | Protect admin routes with server-side role checks | Must |
| AUTH-05 | Prevent stale asynchronous profile requests from overwriting newer authenticated state | Must |
| AUTH-06 | Fall back to ordinary API refetch and visible error/retry states when realtime is unavailable | Must |

### 5.3 Member dashboard

| ID | Requirement | Priority |
|---|---|---|
| MEM-01 | Display current plan, billing cycle, membership state, join date, and expiry or renewal information | Must |
| MEM-02 | Allow members to edit supported profile fields through the profile/settings modal | Must |
| MEM-03 | Display payment history and receipts | Must |
| MEM-04 | Display upcoming and historical bookings with cancellation capability | Must |
| MEM-05 | Display notifications with unread count, read state, and realtime delivery | Must |
| MEM-06 | Update membership, payments, bookings, classes, and notifications when corresponding realtime events arrive | Must |
| MEM-07 | Restrict class booking to eligible paid active members | Must |

### 5.4 Administrator dashboard

| ID | Requirement | Priority |
|---|---|---|
| ADM-01 | Display operational statistics for members, classes, bookings, payments, and revenue | Must |
| ADM-02 | List active member profiles with search, filtering, sorting, and detail view | Must |
| ADM-03 | Create a member profile for an existing Neon Auth user | Must |
| ADM-04 | Edit member identity metadata, phone, plan, billing cycle, role, verification flag, and membership status subject to authorization | Must |
| ADM-05 | Activate, suspend, and soft-delete member profiles | Must |
| ADM-06 | Manage classes with create, read, update, and delete operations | Must |
| ADM-07 | Manage trainers with create, read, update, and soft-delete operations | Must |
| ADM-08 | Review payments and payment status summaries | Must |
| ADM-09 | Receive live member-registration, profile-status, class, trainer, booking, payment, and notification updates | Must |
| ADM-10 | Render action menus outside overflow containers so they are not clipped | Must |

### 5.5 Realtime synchronization

| ID | Requirement | Priority |
|---|---|---|
| RT-01 | Maintain a Socket.IO connection for authenticated users and public visitors when the configured API origin is available | Must |
| RT-02 | Authenticate private sockets with a Neon Auth JWT and authorize member-room joins against the member profile | Must |
| RT-03 | Broadcast a non-sensitive `resource-changed` event for relevant database mutations | Must |
| RT-04 | Keep private notification and member-specific payment or booking details in authenticated member rooms | Must |
| RT-05 | Invalidate only affected React Query keys on receipt of a resource event | Must |
| RT-06 | Reconnect automatically after temporary transport failure | Must |
| RT-07 | Keep API responses authoritative; realtime events are cache-refresh signals, not trusted state writes | Must |
| RT-08 | Avoid duplicate event listeners when navigating between pages or reconnecting | Must |
| RT-09 | Expose connection failures in logs and preserve usable API-driven functionality | Must |

## 6. Technical Architecture

### 6.1 Deployment topology

| Component | Responsibility | Production location |
|---|---|---|
| React/Vite frontend | Public pages, member dashboard, admin dashboard, React Query cache, Socket.IO client | Vercel at the configured OptizGYM frontend origin |
| Express API | REST endpoints, authorization, validation, business logic, payment verification, webhooks | Render API service |
| Socket.IO transport | Persistent realtime transport and event fan-out | Same Render process and public API origin |
| Drizzle ORM | Typed database access and mutation workflows | Express API |
| Neon PostgreSQL | Members, instructors, classes, bookings, payments, notifications, activity records | Neon project main branch |
| Neon Auth | Account creation, sign-in, verification, sessions, JWT claims, user metadata | Neon Auth endpoint |
| Paystack | Payment checkout and provider verification/webhooks | Paystack test or live environment |

The existing Render process must remain an always-on Node process for persistent Socket.IO connections. If a future hosting migration uses an autoscaling, multi-instance environment, the platform will require a shared Socket.IO adapter such as Redis or a managed pub/sub layer so events reach clients connected to different instances. The current single Render process does not require that adapter.

### 6.2 Request and event flow

```text
User action or external webhook
        |
        v
Express route -> auth middleware -> Zod validation -> controller/service
        |
        +--> Neon PostgreSQL mutation
        |
        +--> targeted cache invalidation on server
        |
        +--> Socket.IO event fan-out
              |
              +--> resource-changed metadata to connected clients
              +--> private event to member room when sensitive
              +--> public event when content is safe for visitors
        |
        v
React SocketProvider -> React Query invalidation -> authoritative API refetch -> UI update
```

### 6.3 Realtime authorization model

The public socket may receive only events whose payload contains no sensitive member or payment information. Authenticated sockets present a Neon Auth JWT during the Socket.IO handshake. The server verifies the token and stores the authenticated user ID on the socket. A client may join only the room corresponding to its own member ID; the server confirms the requested room ID against the authenticated user’s database record. Administrators receive the same safe global events as other connected clients and gain sensitive data only by calling protected admin REST endpoints.

### 6.4 Event contract

The platform-wide event contract is intentionally metadata-oriented:

```ts
interface RealtimeChangeEvent {
  resource: 'members' | 'classes' | 'trainers' | 'bookings' | 'payments' | 'notifications' | 'stats';
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'suspended' | 'cancelled';
  id?: string;
  timestamp: string;
}
```

| Event | Audience | Payload policy | Client effect |
|---|---|---|---|
| `resource-changed` | All connected clients | Resource, action, optional record ID, timestamp only | Targeted React Query invalidation |
| `class-created` / `class-updated` / `class-deleted` | Public and authenticated clients | Safe public class data or ID | Refresh classes and show optional announcement |
| `trainer-created` / `trainer-updated` / `trainer-deleted` | Public and authenticated clients | Trainer ID only | Refresh instructor and class-enrichment queries |
| `booking-confirmed` / `booking-cancelled` | Relevant member room | Member booking confirmation or cancellation details | Refresh member bookings and show confirmation |
| `payment-success` | Relevant member room | Plan, payment status, expiry where appropriate | Refresh member membership and payment queries |
| `new-notification` | Relevant member room | Notification record | Refresh notification center and show toast |
| `member-profile-updated` | Relevant member room | Member ID only | Refresh the member’s own profile queries |
| `membership-updated` | Connected clients | Member ID, plan/status metadata only | Refresh member/admin summary queries |

Sensitive fields such as email addresses, phone numbers, payment references, and full member records are not placed in global events.

## 7. Data Model Summary

| Entity | Important fields | Key relationships |
|---|---|---|
| Member | Auth user ID, email, full name, phone, role, plan, billing, status, verification, expiry, soft-delete timestamp | Auth identity; owns bookings, payments, notifications, workouts |
| Instructor | Full name, email, specialty, bio, avatar URL, soft-delete timestamp | Referenced by classes |
| Class | Name, instructor, schedule, duration, capacity, enrollment, category, location, difficulty, intensity, requirements | Has bookings; references instructor |
| Booking | Member ID, class ID, status, booked timestamp | Joins members and classes |
| Payment | Member ID, amount, currency, plan, provider reference, status, paid timestamp | Activates or extends membership |
| Notification | Member ID, title, message, type, read state, created timestamp | Delivered to a member room |
| Activity log | Auth user ID, action, entity type, entity ID, metadata | Audits administrative and financial changes |

Soft deletion is required for member and trainer records where historical relationships or auditability must be retained. Public and active admin list queries exclude deleted records.

## 8. Security and Privacy Requirements

The API must remain the security boundary. Every member or admin mutation must enforce ownership or role checks before database access. Zod validation must reject malformed, overlong, or invalid enum values. Admin changes to role and status must be audited. Neon Auth JWT claims must be verified against the configured JWKS endpoint. Paystack webhooks must verify provider signatures before database mutation. Realtime payloads must not expose private member, payment, or authentication data to public clients. CORS must allow only the configured Vercel production aliases and approved local development origins.

The client must never treat a realtime payload as authoritative sensitive state. It should invalidate the relevant query and refetch over the already-authorized REST API. This design limits the impact of stale, duplicated, delayed, or out-of-order events.

## 9. Reliability, Performance, and Observability

### 9.1 Reliability behavior

The Socket.IO client reconnects after temporary failures. API queries remain functional when the socket is unavailable. Realtime handlers are idempotent because they invalidate queries rather than directly appending or mutating records. The server emits events only after successful database mutations, except for future optimistic UI features that must explicitly roll back on failure.

### 9.2 Performance targets

| Metric | Target |
|---|---:|
| Database commit to Socket.IO emission | Under 250 ms in normal operation |
| Event receipt to query invalidation | Under 100 ms in the browser |
| Event receipt to visible refreshed data | Under 2 seconds under normal API latency |
| Socket reconnect after transient failure | Under 10 seconds when the API is available |
| Duplicate event handler registrations | Zero during normal route navigation |
| Sensitive information in global event payloads | Zero |

### 9.3 Logging and monitoring

The API should log socket connection, authentication failure, room authorization failure, disconnect, and broadcast errors with correlation IDs where available. Production monitoring should track active connections, reconnect rate, event counts by resource, handler errors, API refetch failures after events, and Render process restarts. Admin dashboards should expose a subtle connection state indicator in a future iteration so operators can distinguish live data from fallback API polling.

## 10. Testing and Acceptance Criteria

### 10.1 Backend acceptance criteria

A member registration or Neon Auth webhook creates a member profile and emits `resource-changed` with `resource: members` and `action: created`. An admin profile edit emits an updated member event. Activation and suspension emit their corresponding status actions. A class, trainer, booking, payment, or notification mutation emits the matching resource event after the database write succeeds. Private events are sent only to the correct member room. Invalid room joins are rejected. Global event payloads contain no private member fields.

### 10.2 Frontend acceptance criteria

An administrator viewing `/admin/members` sees a new profile or status change without refreshing. A member viewing membership or payments sees a successful payment reflected without refreshing. Public visitors viewing classes or trainers see a new or updated listing without refreshing. A booking changes class enrollment and the member’s booking list without refreshing. A notification appears in the notification center and unread count updates without refreshing. When the socket is disconnected, normal page queries and retry states continue to work.

### 10.3 End-to-end scenarios

| Scenario | Expected result |
|---|---|
| Browser A creates a member profile through admin UI while Browser B views admin members | Browser B list and counts update automatically |
| Admin activates a pending member while that member is on the dashboard | Member membership state updates and eligible class actions become available |
| Admin creates a class while a visitor is on the landing page | Class feed and announcement update without reload |
| Admin edits a trainer while a visitor is on the trainers page | Trainer card updates without reload |
| Member books a class while admin views classes | Enrollment and booking-related statistics update |
| Paystack webhook activates membership while member dashboard is open | Plan, expiry, payments, and notification state update |
| Socket connection fails | UI remains usable through API calls and does not display stale mutation success as authoritative |

## 11. Roadmap

### Phase 1: Realtime foundation — current implementation

The current implementation standardizes resource-change events, extends broadcasts across members, classes, trainers, bookings, payments, notifications, registration webhooks, and payment webhooks, and centralizes React Query invalidation in the Socket.IO provider. It preserves private member-room events for sensitive booking, payment, and notification details.

### Phase 2: Operational visibility

Add a dashboard connection indicator, server-side event metrics, structured broadcast logs, and an admin diagnostic panel showing last event timestamp, connection status, reconnect attempts, and API fallback state.

### Phase 3: Multi-instance scalability

If the API scales beyond one persistent Render process, add a shared Socket.IO adapter backed by Redis or managed pub/sub. Define event delivery guarantees, instance health checks, and graceful draining during deployment.

### Phase 4: Better cache synchronization

Introduce event version numbers or monotonic timestamps, query-level event cursors, and optional optimistic updates for low-risk admin actions. Add deduplication for repeated webhook deliveries and reconnection replay for events that occurred while a client was offline.

### Phase 5: Expanded product operations

Add trainer availability and appointment scheduling, waitlists, program enrollment, attendance scanning, automated renewal reminders, richer member segmentation, and role-specific operational notifications. Each new mutation must join the same event contract and security model.

### Phase 6: Mobile and external integrations

Expose a stable event contract for a future mobile client, add push notifications where appropriate, and integrate approved calendar, messaging, or CRM providers through explicit server-side connectors and webhook verification.

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Render process restart drops socket connections | Users temporarily stop receiving events | Automatic reconnect, API fallback, connection monitoring |
| Multiple API instances do not share in-memory Socket.IO state | Some clients miss events | Use a shared adapter before horizontal scaling |
| Event payload exposes member data | Privacy and security incident | Metadata-only global events; private rooms; API refetch |
| Duplicate webhook delivery | Duplicate payments or events | Idempotent provider references, database uniqueness, safe invalidation |
| Out-of-order events | Temporary stale screen | Treat events as refetch signals; server response remains authoritative |
| Socket event storms during bulk updates | Excessive client refetches | Batch events, debounce invalidation, or add bulk resource events |
| Frontend environment misconfiguration | Realtime silently unavailable in production | Validate `VITE_API_URL`, health endpoint, CORS, and Socket.IO origin during deployment |

## 13. Release Checklist

Before each production release, engineering must confirm that TypeScript compilation, backend tests, frontend tests, end-to-end tests, frontend build, and backend build pass. The production frontend must define `VITE_API_URL` with the public Render API origin. Render must define the approved frontend origin allow-list, Neon Auth URLs, database credentials, Paystack secret, and webhook configuration. A browser test must confirm that `/socket.io/` connects over HTTPS, that an authenticated member room can be joined only by its owner, and that an admin-visible mutation updates a second browser without a manual refresh.

## 14. References

The implementation baseline is represented by the following repository components:

1. [Socket.IO server utility](../server/src/utils/socket.ts)
2. [Frontend Socket.IO provider](../src/contexts/SocketContext.tsx)
3. [Frontend Socket.IO client](../src/lib/socket.ts)
4. [Member controller](../server/src/controllers/memberController.ts)
5. [Class controller](../server/src/controllers/classController.ts)
6. [Booking controller](../server/src/controllers/bookingController.ts)
7. [Payment controller](../server/src/controllers/paymentController.ts)
8. [Webhook controller](../server/src/controllers/webhookController.ts)
9. [Notification controller](../server/src/controllers/notificationController.ts)
10. [Database schema](../server/src/db/schema.ts)
11. [Frontend deployment guide](../FRONTEND_DEPLOYMENT.md)
