import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, sql } from '../utils/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, 'migrations');

try {
  await migrate(db, { migrationsFolder });
  console.log(`[DB] Migrations applied from ${migrationsFolder}`);
} finally {
  await sql.end();
}
