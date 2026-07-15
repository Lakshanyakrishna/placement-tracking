import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const BCRYPT_ROUNDS = parseInt(process.env.AUTH_BCRYPT_ROUNDS || '10', 10);

function fail(msg: string): never {
  console.error(`[rotate-credentials] FATAL: ${msg}`);
  process.exit(1);
}

function log(msg: string): void { console.log(`[rotate-credentials] ${msg}`); }
function ok(msg: string): void { console.log(`  ✓ ${msg}`); }

async function main() {
  const env = process.env.APP_ENV || process.env.NODE_ENV || '';
  if (!env) {
    fail('APP_ENV or NODE_ENV must be explicitly set. Refusing to run with a silent default.');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const newAdminPassword = process.env.NEW_ADMIN_PASSWORD;
  if (!adminEmail) fail('ADMIN_EMAIL environment variable is required.');
  if (!newAdminPassword) fail('NEW_ADMIN_PASSWORD environment variable is required.');

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || (() => { throw new Error('DB_PASSWORD is required'); })(),
    database: process.env.DB_DATABASE || 'placement_tracker',
    entities: [path.resolve(__dirname, '../**/*.entity{.ts,.js}')],
    ssl: process.env.DB_SSL === 'true',
  });

  await ds.initialize();
  log(`connected to database [env=${env}]`);

  const queryRunner = ds.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const userRepo = ds.getRepository('users');

    const userCount = await userRepo.count();
    log(`total users in database: ${userCount}`);

    await queryRunner.manager
      .createQueryBuilder()
      .update('users')
      .set({ must_change_password: true })
      .execute();

    const flaggedCount = userCount;
    ok(`flagged ${flaggedCount} user(s) — must_change_password = true`);

    const adminUser = await queryRunner.manager
      .createQueryBuilder()
      .select('id')
      .from('users', 'u')
      .where('u.email = :email', { email: adminEmail })
      .getRawOne();

    if (!adminUser) {
      fail(`admin user with email "${adminEmail}" not found in the database.`);
    }

    const passwordHash = await bcrypt.hash(newAdminPassword, BCRYPT_ROUNDS);

    await queryRunner.manager
      .createQueryBuilder()
      .update('users')
      .set({ password_hash: passwordHash, must_change_password: false })
      .where('id = :id', { id: adminUser.id })
      .execute();

    ok(`admin password reset for "${adminEmail}" — must_change_password = false`);

    const refreshResult = await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from('refresh_tokens')
      .execute();
    ok(`${refreshResult.affected ?? 0} refresh token(s) revoked`);

    const resetResult = await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from('password_reset_tokens')
      .where('used_at IS NULL')
      .execute();
    ok(`${resetResult.affected ?? 0} unexpired password-reset token(s) revoked`);

    await queryRunner.commitTransaction();

    log('');
    log('═══════════════════════════════════════');
    log('  Rotation completed successfully');
    log('═══════════════════════════════════════');
    log('');
    log(`  Users flagged for password change: ${flaggedCount}`);
    log(`  Admin account:                    ${adminEmail}`);
    log(`  Refresh tokens revoked:           ${refreshResult.affected ?? 0}`);
    log(`  Password-reset tokens revoked:    ${resetResult.affected ?? 0}`);
    log('');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('\n[rotate-credentials] FATAL:', err);
  process.exit(1);
});
