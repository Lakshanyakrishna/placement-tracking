import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDelete1718550000005 implements MigrationInterface {
  name = 'AddSoftDelete1718550000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Add deleted_at columns (must come before partial index creation) ──
    await queryRunner.query(`ALTER TABLE "branches" ADD COLUMN "deleted_at" timestamptz DEFAULT NULL`);
    await queryRunner.query(`ALTER TABLE "sections" ADD COLUMN "deleted_at" timestamptz DEFAULT NULL`);
    await queryRunner.query(`ALTER TABLE "groups" ADD COLUMN "deleted_at" timestamptz DEFAULT NULL`);
    await queryRunner.query(`ALTER TABLE "opportunities" ADD COLUMN "deleted_at" timestamptz DEFAULT NULL`);
    await queryRunner.query(`ALTER TABLE "enrollments" ADD COLUMN "deleted_at" timestamptz DEFAULT NULL`);

    // ── Convert branches.code unique constraint to partial unique index ──
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "uq_branches_code"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_branches_code" ON "branches" ("code") WHERE "deleted_at" IS NULL`,
    );

    // ── Convert branches.name unique constraint to partial unique index ──
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "uq_branches_name"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_branches_name" ON "branches" ("name") WHERE "deleted_at" IS NULL`,
    );

    // ── sections has no unique constraint prior to this migration (unlike branches),
    // so this is a new partial unique index, not a conversion ──
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_sections_period_branch_code" ON "sections" ("academic_period_id", "branch_id", "code") WHERE "deleted_at" IS NULL`,
    );

    // ── Convert enrollments unique index to partial ──
    await queryRunner.query(`DROP INDEX "uq_enrollments_user_period"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_enrollments_user_period" ON "enrollments" ("user_id", "academic_period_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Reverse: enrollments unique index ──
    await queryRunner.query(`DROP INDEX "uq_enrollments_user_period"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_enrollments_user_period" ON "enrollments" ("user_id", "academic_period_id")`,
    );

    // ── Reverse: sections unique index (drop before dropping deleted_at it depends on) ──
    await queryRunner.query(`DROP INDEX "uq_sections_period_branch_code"`);

    // ── Reverse: branches.name unique index back to a plain constraint ──
    await queryRunner.query(`DROP INDEX "uq_branches_name"`);
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "uq_branches_name" UNIQUE ("name")`,
    );

    // ── Drop deleted_at columns ──
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "sections" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "deleted_at"`);

    // ── Reverse: branches.code unique index back to a plain constraint ──
    await queryRunner.query(`DROP INDEX "uq_branches_code"`);
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "uq_branches_code" UNIQUE ("code")`,
    );
  }
}
