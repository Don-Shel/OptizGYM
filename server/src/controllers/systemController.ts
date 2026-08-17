import { Request, Response } from 'express';
import { sql, db } from '../utils/db';
import { successResponse, errorResponse } from '../utils/responses';
import logger from '../utils/logger';
import os from 'os';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await sql`SELECT 1`;
    const latency = Date.now() - start;

    return successResponse(res, {
      status: 'ok',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[HEALTH] ✗ Database connection failed:', error);
    return errorResponse(res, 'Database connection failed', 500, error);
  }
};

export const initDb = async (req: Request, res: Response) => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        plan TEXT DEFAULT 'basic',
        plan_billing TEXT DEFAULT 'monthly',
        membership_status TEXT DEFAULT 'active',
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        instructor TEXT NOT NULL,
        schedule TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        capacity INTEGER DEFAULT 20,
        enrolled INTEGER DEFAULT 0,
        category TEXT,
        location TEXT,
        description TEXT,
        difficulty TEXT DEFAULT 'beginner',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'confirmed',
        booked_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(member_id, class_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        plan TEXT NOT NULL,
        paystack_reference TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        exercises JSONB,
        duration_minutes INTEGER,
        calories_burned INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS instructors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        specialty TEXT,
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT,
        status TEXT DEFAULT 'available',
        last_maintenance TIMESTAMPTZ,
        purchase_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // Update classes to have instructor_id
    await sql`
      ALTER TABLE classes ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES instructors(id)
    `;
    // Add deleted_at for soft delete
    await sql`
      ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `;
    return successResponse(res, { message: 'Database initialized successfully with Phase 2 expansions' });
  } catch (error) {
    return errorResponse(res, 'Failed to initialize database', 500, error);
  }
};

export const seedDb = async (req: Request, res: Response) => {
  try {
    await sql`
      INSERT INTO classes (name, instructor, schedule, duration_minutes, capacity, category, location, description, difficulty)
      VALUES
        ('Power Yoga Flow', 'Sarah Miller', '2026-04-06T07:00:00', 60, 20, 'yoga', 'Studio A', 'A dynamic yoga class combining strength and flexibility.', 'intermediate'),
        ('HIIT Blast', 'Mike Ross', '2026-04-06T09:00:00', 45, 25, 'hiit', 'Main Floor', 'High-intensity interval training to torch calories and build endurance.', 'advanced'),
        ('Strength Foundations', 'Alex Johnson', '2026-04-07T06:00:00', 75, 18, 'strength', 'Weight Room', 'Learn proper form for compound lifts: squat, deadlift, bench.', 'beginner')
      ON CONFLICT DO NOTHING
    `;
    return successResponse(res, { message: 'Database seeded successfully' });
  } catch (error) {
    return errorResponse(res, 'Failed to seed database', 500, error);
  }
};

export const getHealth = async (req: Request, res: Response) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    platform: process.platform,
    version: process.version,
  };

  try {
    await sql`SELECT 1`;
    return successResponse(res, { ...healthInfo, database: 'connected' });
  } catch (error) {
    logger.error('[HEALTH] ✗ Advanced health check failed:', error);
    return successResponse(res, { ...healthInfo, database: 'disconnected', error: 'DB_DOWN' });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [totalMembers, activeMembers, monthlyRevenue, planDistribution, revenueTrend, fillRate, monthlyBookings, totalClasses, upcomingClasses, totalTrainers, pendingPayments, recentMembers, recentPayments] = await Promise.all([
      sql`SELECT count(*)::int AS count FROM members WHERE deleted_at IS NULL`,
      sql`SELECT count(*)::int AS count FROM members WHERE deleted_at IS NULL AND membership_status = 'active'`,
      sql`SELECT COALESCE(sum(amount), 0) AS sum FROM payments WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= date_trunc('month', now())`,
      sql`SELECT COALESCE(plan, 'free') AS name, count(*)::int AS value FROM members WHERE deleted_at IS NULL GROUP BY plan ORDER BY plan`,
      sql`SELECT to_char(date_trunc('month', COALESCE(paid_at, created_at)), 'Mon') AS month, COALESCE(sum(amount), 0) AS revenue FROM payments WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= date_trunc('month', now()) - interval '5 months' GROUP BY date_trunc('month', COALESCE(paid_at, created_at)) ORDER BY date_trunc('month', COALESCE(paid_at, created_at))`,
      sql`SELECT COALESCE(avg(CASE WHEN capacity > 0 THEN enrolled::numeric / capacity * 100 ELSE 0 END), 0) AS percentage FROM classes WHERE deleted_at IS NULL AND schedule >= now() - interval '30 days'`,
      sql`SELECT count(*)::int AS count FROM bookings WHERE status = 'confirmed' AND booked_at >= date_trunc('month', now())`,
      sql`SELECT count(*)::int AS count FROM classes WHERE deleted_at IS NULL`,
      sql`SELECT count(*)::int AS count FROM classes WHERE deleted_at IS NULL AND schedule >= now()`,
      sql`SELECT count(*)::int AS count FROM instructors WHERE deleted_at IS NULL`,
      sql`SELECT count(*)::int AS count FROM payments WHERE status IN ('pending', 'abandoned')`,
      sql`SELECT id, auth_user_id AS \"authUserId\", email, full_name AS \"fullName\", plan, plan_billing AS \"planBilling\", membership_status AS \"membershipStatus\", joined_at AS \"joinedAt\", expires_at AS \"expiresAt\" FROM members WHERE deleted_at IS NULL ORDER BY joined_at DESC LIMIT 5`,
      sql`SELECT p.id, p.member_id AS \"memberId\", m.full_name AS \"memberName\", m.email AS \"memberEmail\", p.amount, p.currency, p.plan, p.paystack_reference AS \"paystackReference\", p.status, p.paid_at AS \"paidAt\", p.created_at AS \"createdAt\" FROM payments p LEFT JOIN members m ON m.id = p.member_id ORDER BY p.created_at DESC LIMIT 5`,
    ]);

    const palette: Record<string, string> = { free: '#6b7280', basic: '#94a3b8', pro: '#a3e635', elite: '#22d3ee' };
    return successResponse(res, {
      totalMembers: Number(totalMembers[0]?.count || 0),
      activeMembers: Number(activeMembers[0]?.count || 0),
      monthlyRevenue: Number(monthlyRevenue[0]?.sum || 0),
      monthlyBookings: Number(monthlyBookings[0]?.count || 0),
      attendanceRate: Math.round(Number(fillRate[0]?.percentage || 0)),
      totalClasses: Number(totalClasses[0]?.count || 0),
      upcomingClasses: Number(upcomingClasses[0]?.count || 0),
      totalTrainers: Number(totalTrainers[0]?.count || 0),
      pendingPayments: Number(pendingPayments[0]?.count || 0),
      planDistribution: planDistribution.map((row: any) => ({ name: String(row.name).replace(/^./, (char) => char.toUpperCase()), value: Number(row.value), color: palette[row.name] || '#6b7280' })),
      revenueTrend: revenueTrend.map((row: any) => ({ month: row.month, revenue: Number(row.revenue || 0) })),
      recentMembers,
      recentPayments,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch admin stats', 500, error);
  }
};





export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const [summary, bookingTrend, membershipGrowth, revenueByPlan, capacityUtilization, membershipStatus, paymentStatus, bookingStatus] = await Promise.all([
      sql`SELECT
            (SELECT count(*)::int FROM members WHERE deleted_at IS NULL) AS total_members,
            (SELECT count(*)::int FROM members WHERE deleted_at IS NULL AND membership_status = 'active') AS active_members,
            (SELECT COALESCE(sum(amount), 0) FROM payments WHERE status = 'paid') AS total_revenue,
            (SELECT count(*)::int FROM bookings WHERE status = 'confirmed') AS confirmed_bookings,
            (SELECT count(*)::int FROM members WHERE deleted_at IS NULL AND joined_at >= date_trunc('month', now())) AS new_members_this_month,
            (SELECT COALESCE(avg(CASE WHEN capacity > 0 THEN enrolled::numeric / capacity * 100 ELSE 0 END), 0) FROM classes WHERE deleted_at IS NULL AND schedule >= now()) AS average_utilization`,
      sql`SELECT to_char(date_trunc('month', booked_at), 'Mon') AS month,
                 count(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
                 count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
          FROM bookings
          WHERE booked_at >= date_trunc('month', now()) - interval '5 months'
          GROUP BY date_trunc('month', booked_at)
          ORDER BY date_trunc('month', booked_at)`,
      sql`SELECT to_char(date_trunc('month', joined_at), 'Mon') AS month,
                 count(*)::int AS new_members
          FROM members
          WHERE deleted_at IS NULL
            AND joined_at >= date_trunc('month', now()) - interval '5 months'
          GROUP BY date_trunc('month', joined_at)
          ORDER BY date_trunc('month', joined_at)`,
      sql`SELECT COALESCE(plan, 'free') AS plan,
                 count(*)::int AS transactions,
                 COALESCE(sum(amount), 0) AS revenue
          FROM payments
          WHERE status = 'paid'
          GROUP BY COALESCE(plan, 'free')
          ORDER BY revenue DESC`,
      sql`SELECT id, name, schedule, capacity, enrolled,
                 round(CASE WHEN capacity > 0 THEN enrolled::numeric / capacity * 100 ELSE 0 END, 1) AS utilization
          FROM classes
          WHERE deleted_at IS NULL
            AND schedule >= now()
          ORDER BY utilization DESC, schedule ASC
          LIMIT 12`,
      sql`SELECT COALESCE(membership_status, 'unknown') AS status, count(*)::int AS count
          FROM members
          WHERE deleted_at IS NULL
          GROUP BY COALESCE(membership_status, 'unknown')
          ORDER BY count DESC`,
      sql`SELECT COALESCE(status, 'unknown') AS status,
                 count(*)::int AS count,
                 COALESCE(sum(amount), 0) AS amount
          FROM payments
          GROUP BY COALESCE(status, 'unknown')
          ORDER BY count DESC`,
      sql`SELECT COALESCE(status, 'unknown') AS status, count(*)::int AS count
          FROM bookings
          GROUP BY COALESCE(status, 'unknown')
          ORDER BY count DESC`,
    ]);

    const summaryRow = summary[0] || {};
    return successResponse(res, {
      summary: {
        totalMembers: Number(summaryRow.total_members || 0),
        activeMembers: Number(summaryRow.active_members || 0),
        totalRevenue: Number(summaryRow.total_revenue || 0),
        confirmedBookings: Number(summaryRow.confirmed_bookings || 0),
        newMembersThisMonth: Number(summaryRow.new_members_this_month || 0),
        averageUtilization: Number(summaryRow.average_utilization || 0),
      },
      bookingTrend: bookingTrend.map((row: any) => ({
        month: row.month,
        confirmed: Number(row.confirmed || 0),
        cancelled: Number(row.cancelled || 0),
        total: Number(row.confirmed || 0) + Number(row.cancelled || 0),
      })),
      membershipGrowth: membershipGrowth.map((row: any) => ({
        month: row.month,
        newMembers: Number(row.new_members || 0),
      })),
      revenueByPlan: revenueByPlan.map((row: any) => ({
        plan: String(row.plan).replace(/^./, (char) => char.toUpperCase()),
        transactions: Number(row.transactions || 0),
        revenue: Number(row.revenue || 0),
      })),
      capacityUtilization: capacityUtilization.map((row: any) => ({
        id: row.id,
        name: row.name,
        schedule: row.schedule,
        capacity: Number(row.capacity || 0),
        enrolled: Number(row.enrolled || 0),
        utilization: Number(row.utilization || 0),
      })),
      membershipStatus: membershipStatus.map((row: any) => ({ status: row.status, count: Number(row.count || 0) })),
      paymentStatus: paymentStatus.map((row: any) => ({ status: row.status, count: Number(row.count || 0), amount: Number(row.amount || 0) })),
      bookingStatus: bookingStatus.map((row: any) => ({ status: row.status, count: Number(row.count || 0) })),
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch analytics', 500, error);
  }
};
