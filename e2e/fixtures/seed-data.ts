// Mirrors the fake fixture data produced by `src/scripts/seed.ts`.
// If that script's group/roll numbering ever changes, update this file to match.

export const SEED_PASSWORD = process.env.SEED_PASSWORD || 'dev-only-password';

// Fixed password the "workhorse" accounts below are moved to during global setup,
// so most spec files can log in without ever touching the forced-password-change UI.
export const E2E_PASSWORD = 'E2eNewPass123!';

export const STUDENTS_PER_GROUP = 23;

function emailForRoll(roll: string): string {
  return `${roll.toLowerCase()}@placementtracker.edu`;
}

function rollForStudentNumber(n: number): string {
  return `TEST${String(n).padStart(4, '0')}`;
}

export const ADMIN = {
  email: 'admin@placementtracker.edu',
  // Seeded with mustChangePassword: false — never needs a password change.
  password: SEED_PASSWORD,
};

// Student 1 — team leader of Group 1 AND the section mentor (seed.ts assigns both
// roles to the first student of the first group). Useful for "mentor" tests and for
// "team leader of group 1" tests, but NOT useful for isolating mentor-only behavior
// from team-leader-only behavior, since this one account holds both roles at once.
export const MENTOR_AND_TL1 = {
  roll: rollForStudentNumber(1),
  name: 'Student 1',
  email: emailForRoll(rollForStudentNumber(1)),
  seedPassword: SEED_PASSWORD,
  password: E2E_PASSWORD, // after global setup completes the forced change
  groupName: 'Group 1',
};

// Student 24 — first student of Group 2, so a team_leader but NOT the mentor.
// Use this account whenever a test needs to distinguish team-leader-only behavior
// from mentor behavior.
export const TEAM_LEADER_GROUP2 = {
  roll: rollForStudentNumber(STUDENTS_PER_GROUP + 1),
  name: 'Student 24',
  email: emailForRoll(rollForStudentNumber(STUDENTS_PER_GROUP + 1)),
  seedPassword: SEED_PASSWORD,
  password: E2E_PASSWORD,
  groupName: 'Group 2',
};

// Student 2 — an ordinary Group 1 student with no team_leader/mentor role.
export const STUDENT = {
  roll: rollForStudentNumber(2),
  name: 'Student 2',
  email: emailForRoll(rollForStudentNumber(2)),
  seedPassword: SEED_PASSWORD,
  password: E2E_PASSWORD,
  groupName: 'Group 1',
};

// Student 25 — an ordinary Group 2 student (Group 2's TL is student 24). Used to
// verify group-scoped targeting excludes students outside the targeted group.
export const STUDENT_GROUP2 = {
  roll: rollForStudentNumber(STUDENTS_PER_GROUP + 2),
  name: 'Student 25',
  email: emailForRoll(rollForStudentNumber(STUDENTS_PER_GROUP + 2)),
  seedPassword: SEED_PASSWORD,
  password: E2E_PASSWORD,
  groupName: 'Group 2',
};

// Student 3 — deliberately left untouched by global setup (still has
// mustChangePassword: true) so auth.spec.ts can exercise the forced-change flow.
export const FRESH_STUDENT = {
  roll: rollForStudentNumber(3),
  name: 'Student 3',
  email: emailForRoll(rollForStudentNumber(3)),
  password: SEED_PASSWORD,
  groupName: 'Group 1',
};

// A second untouched account for tests that need their own fresh must-change-password
// user without interfering with FRESH_STUDENT (e.g. running auth.spec.ts twice, or a
// second scenario in the same run).
export const FRESH_STUDENT_2 = {
  roll: rollForStudentNumber(4),
  name: 'Student 4',
  email: emailForRoll(rollForStudentNumber(4)),
  password: SEED_PASSWORD,
  groupName: 'Group 1',
};

export const BRANCH_CODE = 'AI&DS';
export const SECTION_CODE = 'IV-AI&DS-A';
export const ACADEMIC_PERIOD_LABEL = 'Semester 1 (2025-2026)';

export const WORKHORSE_ACCOUNTS = [MENTOR_AND_TL1, TEAM_LEADER_GROUP2, STUDENT, STUDENT_GROUP2];
