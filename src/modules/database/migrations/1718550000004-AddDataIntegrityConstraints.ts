import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataIntegrityConstraints1718550000004 implements MigrationInterface {
  name = 'AddDataIntegrityConstraints1718550000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 0. Validate and clean orphaned opportunity target references ──
    const orphanedBranch = await queryRunner.query(
      `SELECT o.id, o.target_branch_id
       FROM opportunities o
       WHERE o.target_branch_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM branches b WHERE b.id = o.target_branch_id)`,
    );
    if (orphanedBranch.length > 0) {
      console.warn(
        `[migration] Clearing ${orphanedBranch.length} opportunity target_branch_id value(s) ` +
          `that reference non-existent branches:`,
        orphanedBranch.map((r: any) => `{id: ${r.id}, target_branch_id: ${r.target_branch_id}}`).join(', '),
      );
      await queryRunner.query(
        `UPDATE opportunities SET target_branch_id = NULL
         WHERE target_branch_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM branches WHERE id = target_branch_id)`,
      );
    }

    const orphanedSection = await queryRunner.query(
      `SELECT o.id, o.target_section_id
       FROM opportunities o
       WHERE o.target_section_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.id = o.target_section_id)`,
    );
    if (orphanedSection.length > 0) {
      console.warn(
        `[migration] Clearing ${orphanedSection.length} opportunity target_section_id value(s) ` +
          `that reference non-existent sections:`,
        orphanedSection.map((r: any) => `{id: ${r.id}, target_section_id: ${r.target_section_id}}`).join(', '),
      );
      await queryRunner.query(
        `UPDATE opportunities SET target_section_id = NULL
         WHERE target_section_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM sections WHERE id = target_section_id)`,
      );
    }

    const orphanedBatch = await queryRunner.query(
      `SELECT o.id, o.target_batch_id
       FROM opportunities o
       WHERE o.target_batch_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.id = o.target_batch_id)`,
    );
    if (orphanedBatch.length > 0) {
      console.warn(
        `[migration] Clearing ${orphanedBatch.length} opportunity target_batch_id value(s) ` +
          `that reference non-existent batches:`,
        orphanedBatch.map((r: any) => `{id: ${r.id}, target_batch_id: ${r.target_batch_id}}`).join(', '),
      );
      await queryRunner.query(
        `UPDATE opportunities SET target_batch_id = NULL
         WHERE target_batch_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM batches WHERE id = target_batch_id)`,
      );
    }

    // ── 1. FK constraints on opportunities targeting columns ──
    await queryRunner.query(`
      ALTER TABLE "opportunities"
        ADD CONSTRAINT "fk_opportunities_target_branch"
          FOREIGN KEY ("target_branch_id")
          REFERENCES "branches"("id")
          ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "opportunities"
        ADD CONSTRAINT "fk_opportunities_target_section"
          FOREIGN KEY ("target_section_id")
          REFERENCES "sections"("id")
          ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "opportunities"
        ADD CONSTRAINT "fk_opportunities_target_batch"
          FOREIGN KEY ("target_batch_id")
          REFERENCES "batches"("id")
          ON DELETE SET NULL
    `);

    // ── 2. Indexes on targeting columns (for findAll filter queries) ──
    await queryRunner.query(`CREATE INDEX "idx_opportunities_target_branch" ON "opportunities" ("target_branch_id")`);
    await queryRunner.query(`CREATE INDEX "idx_opportunities_target_section" ON "opportunities" ("target_section_id")`);
    await queryRunner.query(`CREATE INDEX "idx_opportunities_target_batch" ON "opportunities" ("target_batch_id")`);

    // ── 3. Unique constraint on enrollments to prevent duplicates ──
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_enrollments_user_period"
        ON "enrollments" ("user_id", "academic_period_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Reverse: unique constraint ──
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_enrollments_user_period"`);

    // ── Reverse: indexes ──
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_opportunities_target_batch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_opportunities_target_section"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_opportunities_target_branch"`);

    // ── Reverse: FK constraints ──
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "fk_opportunities_target_batch"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "fk_opportunities_target_section"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "fk_opportunities_target_branch"`);
  }
}
