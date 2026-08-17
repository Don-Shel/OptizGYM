import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../utils/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, 'migrations');
const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');

/**
 * Older OptizGYM deployments were created before Drizzle migration history was
 * enabled. If the database already has the baseline application schema but an
 * empty migration table, record the historical migrations as applied so the
 * runner can safely execute only the pending migrations.
 */
const bootstrapLegacyMigrationHistory = async () => {
  await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const { rows: migrationRows } = await pool.query(
    'SELECT id FROM "drizzle"."__drizzle_migrations" ORDER BY created_at DESC LIMIT 1',
  );
  if (migrationRows.length > 0) return;

  const { rows: schemaRows } = await pool.query(`
    SELECT
      to_regclass('public.members') AS members_table,
      to_regtype('public.plan') AS plan_type,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'freeze_until'
      ) AS has_membership_controls,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'intensity'
      ) AS has_class_intensity,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'requirements'
      ) AS has_class_requirements
  `);
  const hasLegacySchema = Boolean(
    schemaRows[0]?.members_table
      && schemaRows[0]?.plan_type
      && schemaRows[0]?.has_membership_controls
      && schemaRows[0]?.has_class_intensity
      && schemaRows[0]?.has_class_requirements,
  );
  if (!hasLegacySchema) return;

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const historicalEntries = journal.entries.slice(0, -1);

  for (const entry of historicalEntries) {
    const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const hash = crypto.createHash('sha256').update(migrationSql).digest('hex');
    await pool.query(
      'INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)',
      [hash, entry.when],
    );
  }

  console.log(`[DB] Bootstrapped ${historicalEntries.length} legacy migration entries`);
};

try {
  await bootstrapLegacyMigrationHistory();
  await migrate(db, { migrationsFolder });
  console.log(`[DB] Migrations applied from ${migrationsFolder}`);
} finally {
  await pool.end();
}
