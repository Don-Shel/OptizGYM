import { pgTable, uuid, text, timestamp, integer, numeric, date, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'basic', 'pro', 'elite']);
export const billingEnum = pgEnum('plan_billing', ['monthly', 'yearly']);
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'pending', 'expired', 'cancelled']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const roleEnum = pgEnum('role', ['member', 'admin']);

// ── Members ──
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').unique().notNull(),
  username: text('username').unique(),
  email: text('email').notNull(),
  isEmailVerified: integer('is_email_verified').default(0), // 0 for false, 1 for true
  fullName: text('full_name'),
  phone: text('phone'),
  role: roleEnum('role').default('member'),
  plan: planEnum('plan').default('free'),
  planBilling: billingEnum('plan_billing').default('monthly'),
  membershipStatus: membershipStatusEnum('membership_status').default('pending'),
  joinedAt: timestamp('joined_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete
  freezeUntil: timestamp('freeze_until'),
  cancelAtPeriodEnd: integer('cancel_at_period_end').default(0),
}, (table) => {
  return {
    authIdx: index('auth_user_id_idx').on(table.authUserId),
    usernameIdx: index('username_idx').on(table.username),
    emailIdx: index('email_idx').on(table.email),
  };
});

// ── Instructors (Phase 2 Expansion) ──
export const instructors = pgTable('instructors', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  specialty: text('specialty'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => {
  return {
    instructorEmailIdx: index('instructor_email_idx').on(table.email),
  };
});

// ── Classes ──
export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  instructorId: uuid('instructor_id').references(() => instructors.id), // Link to instructors
  instructorLegacy: text('instructor'), // Keep for migration compatibility
  schedule: timestamp('schedule').notNull(),
  durationMinutes: integer('duration_minutes').default(60),
  capacity: integer('capacity').default(20),
  enrolled: integer('enrolled').default(0),
  category: text('category'),
  location: text('location'),
  description: text('description'),
  difficulty: difficultyEnum('difficulty').default('beginner'),
  intensity: text('intensity').default('medium'),
  requirements: text('requirements'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => {
  return {
    scheduleIdx: index('schedule_idx').on(table.schedule),
    instructorIdx: index('class_instructor_idx').on(table.instructorId),
    categoryIdx: index('category_idx').on(table.category),
  };
});

// ── Bookings ──
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  status: text('status').default('confirmed'),
  bookedAt: timestamp('booked_at').defaultNow(),
}, (table) => {
  return {
    bookingMemberIdx: index('booking_member_idx').on(table.memberId),
    bookingClassIdx: index('booking_class_idx').on(table.classId),
  };
});

// ── Payments ──
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  plan: text('plan').notNull(),
  paystackReference: text('paystack_reference').unique(),
  status: text('status').default('pending'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    paymentMemberIdx: index('payment_member_idx').on(table.memberId),
    paymentRefIdx: index('payment_ref_idx').on(table.paystackReference),
  };
});

// ── Workouts ──
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  type: text('type'),
  exercises: jsonb('exercises'),
  durationMinutes: integer('duration_minutes'),
  caloriesBurned: integer('calories_burned'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    workoutMemberIdx: index('workout_member_idx').on(table.memberId),
    workoutDateIdx: index('workout_date_idx').on(table.date),
  };
});

// ── Equipment Inventory (Phase 2 Expansion) ──
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category'),
  status: text('status').default('available'), // available, maintenance, broken
  lastMaintenance: timestamp('last_maintenance'),
  purchaseDate: date('purchase_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ── Notifications (Phase 2 Expansion) ──
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'), // info, warning, success
  isRead: integer('is_read').default(0), // 0 for false, 1 for true
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    notifMemberIdx: index('notification_member_idx').on(table.memberId),
    notifCreatedIdx: index('notification_created_idx').on(table.createdAt),
  };
});

// ── Activity Logs (Phase 5) ──
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    activityAuthIdx: index('activity_auth_idx').on(table.authUserId),
    activityActionIdx: index('activity_action_idx').on(table.action),
    activityCreatedIdx: index('activity_created_idx').on(table.createdAt),
  };
});
