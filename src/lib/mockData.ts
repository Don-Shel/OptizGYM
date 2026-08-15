// Mock data — replace with real Neon DB queries via API routes when configured

export interface GymClass {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  day: string;
  time: string;
  duration: number;
  capacity: number;
  enrolled: number;
  category: "strength" | "cardio" | "yoga" | "hiit" | "cycling" | "boxing";
  location: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  color: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: "basic" | "pro" | "elite";
  status: "active" | "expired" | "pending";
  joinDate: string;
  nextBilling: string;
  totalPayments: number;
  classesAttended: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: "paid" | "pending" | "failed";
  reference: string;
  method: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  type: string;
  duration: number;
  calories: number;
  exercises: { name: string; sets: number; reps: number; weight?: number }[];
}

export const MOCK_CLASSES: GymClass[] = [
  {
    id: "cls_001", name: "Power Yoga Flow", instructor: "Sarah Miller", day: "Monday",
    schedule: "2026-04-06T07:00:00", time: "7:00 AM", duration: 60, capacity: 20, enrolled: 15,
    category: "yoga", location: "Studio A", difficulty: "intermediate",
    description: "A dynamic yoga class combining strength and flexibility.",
    color: "from-teal-500/20 to-teal-500/5",
  },
  {
    id: "cls_002", name: "HIIT Blast", instructor: "Mike Ross", day: "Monday",
    schedule: "2026-04-06T09:00:00", time: "9:00 AM", duration: 45, capacity: 25, enrolled: 23,
    category: "hiit", location: "Main Floor", difficulty: "advanced",
    description: "High-intensity interval training to torch calories and build endurance.",
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "cls_003", name: "Strength Foundations", instructor: "Alex Johnson", day: "Tuesday",
    schedule: "2026-04-07T06:00:00", time: "6:00 AM", duration: 75, capacity: 18, enrolled: 10,
    category: "strength", location: "Weight Room", difficulty: "beginner",
    description: "Learn proper form for compound lifts: squat, deadlift, bench.",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: "cls_004", name: "Spin Cycle", instructor: "Emily Chen", day: "Tuesday",
    schedule: "2026-04-07T18:00:00", time: "6:00 PM", duration: 50, capacity: 30, enrolled: 28,
    category: "cycling", location: "Cycling Studio", difficulty: "intermediate",
    description: "High-energy indoor cycling session with rhythm-based intervals.",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "cls_005", name: "Boxing Fundamentals", instructor: "Mike Ross", day: "Wednesday",
    schedule: "2026-04-08T17:30:00", time: "5:30 PM", duration: 60, capacity: 16, enrolled: 14,
    category: "boxing", location: "Boxing Ring", difficulty: "beginner",
    description: "Learn footwork, jabs, and combinations in a safe environment.",
    color: "from-red-500/20 to-red-500/5",
  },
  {
    id: "cls_006", name: "Advanced Deadlifts", instructor: "Alex Johnson", day: "Thursday",
    schedule: "2026-04-09T07:00:00", time: "7:00 AM", duration: 60, capacity: 12, enrolled: 8,
    category: "strength", location: "Weight Room", difficulty: "advanced",
    description: "Master conventional, sumo, and Romanian deadlift variations.",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: "cls_007", name: "Morning HIIT", instructor: "Emily Chen", day: "Friday",
    schedule: "2026-04-10T06:30:00", time: "6:30 AM", duration: 40, capacity: 25, enrolled: 20,
    category: "hiit", location: "Main Floor", difficulty: "intermediate",
    description: "Start your Friday strong with this fast-paced metabolic circuit.",
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "cls_008", name: "Restorative Yoga", instructor: "Sarah Miller", day: "Saturday",
    schedule: "2026-04-11T10:00:00", time: "10:00 AM", duration: 90, capacity: 20, enrolled: 12,
    category: "yoga", location: "Studio A", difficulty: "beginner",
    description: "Gentle stretches and mindfulness for recovery and relaxation.",
    color: "from-teal-500/20 to-teal-500/5",
  },
];

export const MOCK_MEMBERS: Member[] = [
  { id: "m001", name: "Alex Johnson", email: "alex@example.com", phone: "+1 555-0101", plan: "pro", status: "active", joinDate: "2024-01-15", nextBilling: "2026-04-15", totalPayments: 885, classesAttended: 47 },
  { id: "m002", name: "Priya Sharma", email: "priya@example.com", phone: "+1 555-0102", plan: "elite", status: "active", joinDate: "2023-11-20", nextBilling: "2026-04-20", totalPayments: 2178, classesAttended: 112 },
  { id: "m003", name: "James Kim", email: "james@example.com", phone: "+1 555-0103", plan: "basic", status: "active", joinDate: "2025-02-01", nextBilling: "2026-04-01", totalPayments: 406, classesAttended: 29 },
  { id: "m004", name: "Maria Garcia", email: "maria@example.com", phone: "+1 555-0104", plan: "pro", status: "expired", joinDate: "2024-06-10", nextBilling: "—", totalPayments: 590, classesAttended: 34 },
  { id: "m005", name: "Tom Williams", email: "tom@example.com", phone: "+1 555-0105", plan: "elite", status: "active", joinDate: "2024-03-05", nextBilling: "2026-04-05", totalPayments: 1188, classesAttended: 78 },
  { id: "m006", name: "Aisha Osei", email: "aisha@example.com", phone: "+1 555-0106", plan: "basic", status: "pending", joinDate: "2026-03-28", nextBilling: "2026-04-28", totalPayments: 29, classesAttended: 2 },
  { id: "m007", name: "Lucas Fernandez", email: "lucas@example.com", phone: "+1 555-0107", plan: "pro", status: "active", joinDate: "2024-09-12", nextBilling: "2026-04-12", totalPayments: 531, classesAttended: 55 },
  { id: "m008", name: "Yuki Tanaka", email: "yuki@example.com", phone: "+1 555-0108", plan: "pro", status: "active", joinDate: "2025-01-03", nextBilling: "2026-04-03", totalPayments: 413, classesAttended: 33 },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: "pay_001", date: "2026-03-15", amount: 59, plan: "Pro Monthly", status: "paid", reference: "txn_3g2k9x", method: "Paystack" },
  { id: "pay_002", date: "2026-02-15", amount: 59, plan: "Pro Monthly", status: "paid", reference: "txn_2f1j8w", method: "Paystack" },
  { id: "pay_003", date: "2026-01-15", amount: 59, plan: "Pro Monthly", status: "paid", reference: "txn_1e0i7v", method: "Paystack" },
  { id: "pay_004", date: "2025-12-15", amount: 59, plan: "Pro Monthly", status: "paid", reference: "txn_0d9h6u", method: "Paystack" },
  { id: "pay_005", date: "2025-11-15", amount: 59, plan: "Pro Monthly", status: "paid", reference: "txn_9c8g5t", method: "Paystack" },
];

export const MOCK_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: "wl_001", date: "2026-03-30", type: "Strength", duration: 65, calories: 380,
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weight: 185 },
      { name: "Bench Press", sets: 3, reps: 10, weight: 155 },
      { name: "Deadlift", sets: 3, reps: 5, weight: 225 },
    ],
  },
  {
    id: "wl_002", date: "2026-03-28", type: "HIIT Cardio", duration: 40, calories: 520,
    exercises: [
      { name: "Burpees", sets: 5, reps: 15 },
      { name: "Box Jumps", sets: 4, reps: 12 },
      { name: "Mountain Climbers", sets: 5, reps: 30 },
    ],
  },
  {
    id: "wl_003", date: "2026-03-25", type: "Upper Body", duration: 55, calories: 290,
    exercises: [
      { name: "Pull-ups", sets: 4, reps: 8 },
      { name: "Shoulder Press", sets: 3, reps: 12, weight: 95 },
      { name: "Lat Pulldown", sets: 3, reps: 12, weight: 120 },
    ],
  },
  {
    id: "wl_004", date: "2026-03-23", type: "Yoga", duration: 60, calories: 180,
    exercises: [{ name: "Flow Session", sets: 1, reps: 1 }],
  },
  {
    id: "wl_005", date: "2026-03-20", type: "Strength", duration: 70, calories: 410,
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weight: 190 },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weight: 175 },
      { name: "Leg Press", sets: 3, reps: 12, weight: 280 },
    ],
  },
];

export const ADMIN_STATS = {
  totalMembers: 2547,
  activeMembers: 2198,
  newThisMonth: 89,
  totalRevenue: 124850,
  revenueThisMonth: 18940,
  classesThisWeek: 24,
  avgAttendance: 76,
  memberGrowth: [
    { month: "Oct", members: 2180 },
    { month: "Nov", members: 2251 },
    { month: "Dec", members: 2290 },
    { month: "Jan", members: 2380 },
    { month: "Feb", members: 2458 },
    { month: "Mar", members: 2547 },
  ],
  revenueData: [
    { month: "Oct", revenue: 14200 },
    { month: "Nov", revenue: 15800 },
    { month: "Dec", revenue: 16100 },
    { month: "Jan", revenue: 17300 },
    { month: "Feb", revenue: 18200 },
    { month: "Mar", revenue: 18940 },
  ],
  planDistribution: [
    { name: "Basic", value: 842, color: "#6b7280" },
    { name: "Pro", value: 1189, color: "#84cc16" },
    { name: "Elite", value: 516, color: "#22d3ee" },
  ],
};
