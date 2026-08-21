import { z } from 'zod';

// ── Member Schema ──
export const memberSchema = z.object({
  auth_user_id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  plan: z.enum(['free', 'basic', 'pro', 'elite']).default('free'),
  plan_billing: z.enum(['monthly', 'yearly']).default('monthly'),
});

const memberPlans = ['free', 'basic', 'pro', 'elite'] as const;
const memberBilling = ['monthly', 'yearly'] as const;
const memberStatuses = ['active', 'pending', 'expired', 'cancelled'] as const;

export const adminMemberCreateSchema = z.object({
  authUserId: z.string().trim().min(1, 'Neon Auth user ID is required').max(200),
  email: z.string().trim().email('Enter a valid email address').max(320),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  plan: z.enum(memberPlans).default('free'),
  planBilling: z.enum(memberBilling).default('monthly'),
  membershipStatus: z.enum(memberStatuses).default('pending'),
  isEmailVerified: z.boolean().default(false),
});

export const adminMemberUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  plan: z.enum(memberPlans).optional(),
  planBilling: z.enum(memberBilling).optional(),
  membershipStatus: z.enum(memberStatuses).optional(),
  role: z.enum(['member', 'admin']).optional(),
  isEmailVerified: z.boolean().optional(),
});

export const adminMemberStatusSchema = z.object({
  membershipStatus: z.enum(memberStatuses),
  plan: z.enum(memberPlans).optional(),
  planBilling: z.enum(memberBilling).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const classSchema = z.object({
  name: z.string().trim().min(1).max(160),
  instructor: z.string().trim().min(1).max(160),
  instructorLegacy: z.string().trim().max(160).optional().or(z.literal('')),
  instructorId: z.string().uuid().nullable().optional(),
  schedule: z.string().datetime(),
  duration_minutes: z.number().int().positive().default(60),
  durationMinutes: z.number().int().positive().optional(),
  capacity: z.number().int().positive().default(20),
  category: z.string().trim().max(80).optional(),
  location: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  requirements: z.string().trim().max(500).optional(),
});

export const trainerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email address').max(320),
  specialty: z.string().trim().max(120).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
  avatarUrl: z.string().trim().url('Avatar URL must be a valid URL').max(1000).optional().or(z.literal('')),
});

const profilePreferencesSchema = z.object({
  fitnessGoal: z.enum(['strength', 'weight_loss', 'endurance', 'mobility', 'general']).optional(),
  preferredWorkoutTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  classReminders: z.boolean().optional(),
  paymentAlerts: z.boolean().optional(),
  activityUpdates: z.boolean().optional(),
});

export const profileSchema = z.object({
  phone: z.string().trim().max(40, 'Phone number is too long').optional().or(z.literal('')),
  preferences: profilePreferencesSchema.optional(),
});

export const bookingSchema = z.object({
  class_id: z.string().uuid(),
});

export const paymentSchema = z.object({
  plan: z.enum(['basic', 'pro', 'elite']),
  billing: z.enum(memberBilling).default('monthly'),
  paystack_reference: z.string().trim().max(200).optional(),
});

export const workoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercises: z.array(z.any()),
  duration_minutes: z.number().int().positive().optional(),
  calories_burned: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});
