import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

// Use standard pg Pool for Node.js backend
// This supports transactions and FOR UPDATE locking natively
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // For Neon, SSL is required
  ssl: process.env.DATABASE_URL.includes('sslmode=require') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false
});

// Raw tagged-query helper retained for the legacy system controller.
// Drizzle-specific expressions should continue importing `sql` from
// `drizzle-orm`; this helper is for direct PostgreSQL statements only.
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const text = strings.reduce(
    (query, chunk, index) => query + chunk + (index < values.length ? `$${index + 1}` : ''),
    '',
  );
  const result = await pool.query(text, values);
  return result.rows;
};

// Drizzle ORM instance with transaction support
export const db = drizzle(pool, { schema });
