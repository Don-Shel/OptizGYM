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

export const classSchema = z.object({
  name: z.string().min(1),
  instructor: z.string().min(1),
  schedule: z.string().datetime(),
  duration_minutes: z.number().int().positive().default(60),
  capacity: z.number().int().positive().default(20),
  category: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  requirements: z.string().max(500).optional(),
});

export const trainerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email address').max(320),
  specialty: z.string().trim().max(120).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
  avatarUrl: z.string().trim().url('Avatar URL must be a valid URL').max(1000).optional().or(z.literal('')),
});

export const bookingSchema = z.object({
  member_id: z.string().uuid(),
  class_id: z.string().uuid(),
});

export const paymentSchema = z.object({
  member_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('KES'),
  plan: z.string(),
  paystack_reference: z.string().optional(),
  status: z.string().default('pending'),
  paid_at: z.string().datetime().optional(),
});

export const workoutSchema = z.object({
  member_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercises: z.array(z.any()),
  duration_minutes: z.number().int().positive().optional(),
  calories_burned: z.number().int().positive().optional(),
  notes: z.string().optional(),
});
