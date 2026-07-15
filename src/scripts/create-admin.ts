import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

function log(msg: string): void { console.log(`[create-admin] ${msg}`); }

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('[create-admin] FATAL: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  if (!process.env.DB_PASSWORD) {
    console.error('[create-admin] FATAL: DB_PASSWORD environment variable is required.');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'placement_tracker',
    entities: [path.resolve(__dirname, '../**/*.entity{.ts,.js}')],
  });
  await ds.initialize();
  log('connected to database');

  const existing = await ds.query('SELECT id FROM "users" WHERE email = $1', [email]);
  if (existing.length > 0) {
    console.error(`[create-admin] FATAL: a user with email ${email} already exists.`);
    await ds.destroy();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [{ id: adminId }] = await ds.query(
    `INSERT INTO "users" ("email", "password_hash", "name", "contact_phone", "is_active", "must_change_password")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"`,
    [email, passwordHash, 'System Administrator', null, true, true],
  );

  await ds.query(
    `INSERT INTO "role_assignments" ("user_id", "role", "scope_type", "scope_id", "granted_by", "valid_from", "valid_to")
     VALUES ($1, 'admin', 'global', NULL, $1, NOW(), NULL)`,
    [adminId],
  );

  await ds.destroy();
  log(`admin user created: ${email} (password change required on first login)`);
}

createAdmin().catch((err) => {
  console.error('\n[create-admin] FATAL:', err);
  process.exit(1);
});
