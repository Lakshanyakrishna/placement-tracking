import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const isProduction = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'dev-only-password';

function log(msg: string): void { console.log(`[seed] ${msg}`); }
function ok(msg: string): void { console.log(`  ✓ ${msg}`); }
function skip(msg: string): void { console.log(`  − ${msg}`); }

function resolveDbPassword(): string {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (isProduction) {
    throw new Error('DB_PASSWORD must be set when running in production (APP_ENV or NODE_ENV=production).');
  }
  console.warn('[seed] DB_PASSWORD is not set — using an insecure development-only fallback. Never use this in production.');
  return 'dev_password_only';
}

async function connect(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: resolveDbPassword(),
    database: process.env.DB_DATABASE || 'placement_tracker',
    entities: [path.resolve(__dirname, '../**/*.entity{.ts,.js}')],
  });
  await ds.initialize();
  log('connected to database');
  return ds;
}

async function insertRow(ds: DataSource, table: string, data: Record<string, any>): Promise<string> {
  const keys = Object.keys(data);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const res = await ds.query(`INSERT INTO "${table}" (${cols}) VALUES (${vals}) RETURNING "id"`, Object.values(data));
  return res[0].id;
}

// ── Fake Student Data ─────────────────────────────────────────────────
// Synthetic roster: 4 groups of 23 students each (92 total). The first
// student in each group is that group's team leader. Roll numbers and
// names are placeholders only — this is test fixture data, not real
// student records.
const STUDENTS_PER_GROUP = 23;
const GROUP_COUNT = 4;

function buildFakeGroup(groupIndex: number): { roll: string; name: string }[] {
  const startNumber = groupIndex * STUDENTS_PER_GROUP;
  return Array.from({ length: STUDENTS_PER_GROUP }, (_, i) => {
    const n = startNumber + i + 1;
    return {
      roll: `TEST${String(n).padStart(4, '0')}`,
      name: `Student ${n}`,
    };
  });
}

const ALL_GROUPS = Array.from({ length: GROUP_COUNT }, (_, gi) => buildFakeGroup(gi));
const GROUP_NAMES = ALL_GROUPS.map((_, gi) => `Group ${gi + 1}`);

function emailFromRoll(roll: string): string {
  return `${roll.toLowerCase()}@placementtracker.edu`;
}

// ── Main ─────────────────────────────────────────────────────────────

async function seed() {
  const ds = await connect();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ── 0. Clean up old data (FK-safe order) ──────────────────────────
  log('cleaning old data...');
  await ds.query(`DELETE FROM verification_logs`);
  await ds.query(`DELETE FROM submission_files`);
  await ds.query(`DELETE FROM file_references`);
  await ds.query(`DELETE FROM submissions`);
  await ds.query(`DELETE FROM participations`);
  await ds.query(`DELETE FROM notifications`);
  await ds.query(`DELETE FROM opportunity_targets`).catch(() => {});
  await ds.query(`DELETE FROM role_assignments`);
  await ds.query(`DELETE FROM enrollments`);
  await ds.query(`DELETE FROM groups`);
  await ds.query(`DELETE FROM sections`);
  await ds.query(`DELETE FROM opportunities`);
  await ds.query(`DELETE FROM batches`);
  await ds.query(`DELETE FROM academic_periods`);
  await ds.query(`DELETE FROM academic_years`);
  await ds.query(`DELETE FROM branches`);
  await ds.query(`DELETE FROM users`);
  ok('old data removed');

  // ── 1. Users ──────────────────────────────────────────────────────
  log('creating users...');
  const users: Record<string, string> = {};

  // Admin (development)
  const adminId = await insertRow(ds, 'users', {
    email: 'admin@placementtracker.edu',
    password_hash: passwordHash,
    name: 'System Admin',
    contact_phone: null,
    is_active: true,
    must_change_password: false,
  });
  users['admin@placementtracker.edu'] = adminId;
  ok('dev admin user');

  // 92 students + 4 TLs = 92 users (TLs are part of the 92)
  const groupUserIds: string[][] = Array.from({ length: GROUP_COUNT }, () => []);

  for (let gi = 0; gi < ALL_GROUPS.length; gi++) {
    const group = ALL_GROUPS[gi];
    for (const student of group) {
      const email = emailFromRoll(student.roll);
      const id = await insertRow(ds, 'users', {
        email,
        password_hash: passwordHash,
        name: student.name,
        contact_phone: null,
        is_active: true,
        must_change_password: true,
      });
      users[email] = id;
      groupUserIds[gi].push(id);
    }
    ok(`${group.length} users for ${GROUP_NAMES[gi]}`);
  }

  const tlEmails = ALL_GROUPS.map(group => emailFromRoll(group[0].roll));
  const tlUserIds = tlEmails.map(e => users[e]);
  const mentorId = tlUserIds[0]; // Student 1 is the mentor for all students

  // ── 2. Academic Year ──────────────────────────────────────────────
  log('seeding academic year...');
  const acYearId = await insertRow(ds, 'academic_years', { label: '2025-2026', is_active: true });
  ok('academic year 2025-2026');

  // ── 3. Academic Period ────────────────────────────────────────────
  log('seeding academic period...');
  const acPeriodId = await insertRow(ds, 'academic_periods', {
    academic_year_id: acYearId,
    label: 'Semester 1 (2025-2026)',
    type: 'semester',
    start_date: '2025-07-01',
    end_date: '2025-12-31',
    is_active: true,
  });
  ok('academic period Semester 1 (2025-2026)');

  // ── 4. Branch ─────────────────────────────────────────────────────
  log('seeding branch...');
  const branchId = await insertRow(ds, 'branches', {
    code: 'AI&DS',
    name: 'Artificial Intelligence & Data Science',
  });
  ok('branch AI&DS');

  // ── 5. Batch ──────────────────────────────────────────────────────
  log('seeding batch...');
  const batchId = await insertRow(ds, 'batches', {
    academic_year_id: acYearId,
    label: 'Batch 2028',
    graduation_year: 2028,
  });
  ok('batch Batch 2028');

  // ── 6. Section ────────────────────────────────────────────────────
  log('seeding section...');
  const sectionId = await insertRow(ds, 'sections', {
    branch_id: branchId,
    academic_period_id: acPeriodId,
    code: 'IV-AI&DS-A',
    mentor_user_id: mentorId,
  });
  ok('section IV-AI&DS-A');

  // ── 7. Groups ─────────────────────────────────────────────────────
  log('seeding groups...');
  const groupIds: string[] = [];
  for (let gi = 0; gi < GROUP_NAMES.length; gi++) {
    const gid = await insertRow(ds, 'groups', {
      section_id: sectionId,
      name: GROUP_NAMES[gi],
      team_leader_user_id: tlUserIds[gi],
    });
    groupIds.push(gid);
    ok(`group ${GROUP_NAMES[gi]}`);
  }

  // ── 8. Enrollments ────────────────────────────────────────────────
  log('seeding enrollments...');
  const allEnrollmentIds: string[] = [];
  for (let gi = 0; gi < ALL_GROUPS.length; gi++) {
    const group = ALL_GROUPS[gi];
    for (let si = 0; si < group.length; si++) {
      const student = group[si];
      const uid = groupUserIds[gi][si];
      const eid = await insertRow(ds, 'enrollments', {
        user_id: uid,
        academic_period_id: acPeriodId,
        branch_id: branchId,
        section_id: sectionId,
        batch_id: batchId,
        group_id: groupIds[gi],
        roll_number: student.roll,
        is_active: true,
      });
      allEnrollmentIds.push(eid);
    }
  }
  ok(`${allEnrollmentIds.length} enrollments created`);

  // ── 9. Role Assignments ───────────────────────────────────────────
  log('seeding role assignments...');
  // Admin (global)
  await insertRow(ds, 'role_assignments', {
    user_id: adminId,
    role: 'admin',
    scope_type: 'global',
    scope_id: null,
    granted_by: adminId,
    valid_from: new Date('2025-07-01'),
    valid_to: null,
  });
  ok('role admin (dev)');

  // Mentor (section-scoped)
  await insertRow(ds, 'role_assignments', {
    user_id: mentorId,
    role: 'mentor',
    scope_type: 'section',
    scope_id: sectionId,
    granted_by: adminId,
    valid_from: new Date('2025-07-01'),
    valid_to: null,
  });
  ok('role mentor');

  // Team Leaders (group-scoped)
  for (let gi = 0; gi < GROUP_NAMES.length; gi++) {
    await insertRow(ds, 'role_assignments', {
      user_id: tlUserIds[gi],
      role: 'team_leader',
      scope_type: 'group',
      scope_id: groupIds[gi],
      granted_by: adminId,
      valid_from: new Date('2025-07-01'),
      valid_to: null,
    });
    ok(`role team_leader for ${GROUP_NAMES[gi]} (${ALL_GROUPS[gi][0].name})`);
  }

  // ── Done ───────────────────────────────────────────────────────────
  await ds.destroy();
  log('');
  log('═══════════════════════════════════════');
  log('  Seed completed successfully');
  log('═══════════════════════════════════════');
  log('');
  log(`  Login credentials (password: ${SEED_PASSWORD}):`);
  log('  ─────────────────────────────────────────');
  log('  Admin:       admin@placementtracker.edu');
  log(`  Mentor:      ${emailFromRoll(ALL_GROUPS[0][0].roll)} (${ALL_GROUPS[0][0].name})`);
  log(`  TL Group 1:  ${emailFromRoll(ALL_GROUPS[0][0].roll)} (${ALL_GROUPS[0][0].name})`);
  log(`  TL Group 2:  ${emailFromRoll(ALL_GROUPS[1][0].roll)} (${ALL_GROUPS[1][0].name})`);
  log(`  TL Group 3:  ${emailFromRoll(ALL_GROUPS[2][0].roll)} (${ALL_GROUPS[2][0].name})`);
  log(`  TL Group 4:  ${emailFromRoll(ALL_GROUPS[3][0].roll)} (${ALL_GROUPS[3][0].name})`);
  log(`  Student:     ${emailFromRoll(ALL_GROUPS[0][1].roll)} (${ALL_GROUPS[0][1].name})`);
  log('');
  log(`  Total students seeded: ${GROUP_COUNT * STUDENTS_PER_GROUP}`);
  log('');
}

seed().catch((err) => {
  console.error('\n[seed] FATAL:', err);
  process.exit(1);
});
