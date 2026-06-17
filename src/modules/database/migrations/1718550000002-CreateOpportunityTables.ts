import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpportunityTables1718550000002 implements MigrationInterface {
  name = 'CreateOpportunityTables1718550000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUMs for opportunity domain
    await queryRunner.query(`CREATE TYPE "public"."opportunity_state_enum" AS ENUM('draft', 'published', 'open', 'closed', 'archived', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "public"."opportunity_type_enum" AS ENUM('internship', 'placement', 'training', 'workshop', 'hackathon', 'other')`);
    await queryRunner.query(`CREATE TYPE "public"."participation_status_enum" AS ENUM('not_started', 'in_progress', 'submitted', 'verified', 'completed', 'incomplete')`);

    // ---- opportunities ----
    await queryRunner.query(`
      CREATE TABLE "opportunities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "academic_period_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "opportunity_type" "public"."opportunity_type_enum" NOT NULL,
        "state" "public"."opportunity_state_enum" NOT NULL DEFAULT 'draft',
        "created_by" uuid NOT NULL,
        "opens_at" timestamptz DEFAULT NULL,
        "closes_at" timestamptz DEFAULT NULL,
        "verification_deadline" interval NOT NULL DEFAULT '7 days',
        "require_proof" boolean NOT NULL DEFAULT true,
        "max_submissions" integer DEFAULT NULL,
        "allow_group_submission" boolean NOT NULL DEFAULT false,
        "target_branch_id" uuid DEFAULT NULL,
        "target_section_id" uuid DEFAULT NULL,
        "target_batch_id" uuid DEFAULT NULL,
        CONSTRAINT "pk_opportunities" PRIMARY KEY ("id"),
        CONSTRAINT "ck_opportunities_max_submissions" CHECK ("max_submissions" IS NULL OR "max_submissions" > 0),
        CONSTRAINT "ck_opportunities_dates" CHECK ("closes_at" IS NULL OR "opens_at" IS NULL OR "closes_at" > "opens_at"),
        CONSTRAINT "fk_opportunities_academic_period" FOREIGN KEY ("academic_period_id")
          REFERENCES "academic_periods"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_opportunities_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_opportunities_academic_period" ON "opportunities" ("academic_period_id")`);
    await queryRunner.query(`CREATE INDEX "idx_opportunities_state" ON "opportunities" ("state")`);
    await queryRunner.query(`CREATE INDEX "idx_opportunities_created_by" ON "opportunities" ("created_by")`);

    // ---- file_references ----
    await queryRunner.query(`
      CREATE TABLE "file_references" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "original_name" varchar(255) NOT NULL,
        "mime_type" varchar(127) NOT NULL,
        "size_bytes" integer NOT NULL,
        "storage_key" text NOT NULL,
        "bucket" varchar(255) NOT NULL,
        CONSTRAINT "pk_file_references" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(`CREATE INDEX "idx_file_references_storage_key" ON "file_references" ("storage_key")`);

    // ---- participations ----
    await queryRunner.query(`
      CREATE TABLE "participations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "opportunity_id" uuid NOT NULL,
        "enrollment_id" uuid NOT NULL,
        "status" "public"."participation_status_enum" NOT NULL DEFAULT 'not_started',
        "team_leader_user_id" uuid DEFAULT NULL,
        "started_at" timestamptz DEFAULT NULL,
        "submitted_at" timestamptz DEFAULT NULL,
        "verified_at" timestamptz DEFAULT NULL,
        "verified_by" uuid DEFAULT NULL,
        "notes" text DEFAULT NULL,
        CONSTRAINT "pk_participations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_participations_opportunity_enrollment" UNIQUE ("opportunity_id", "enrollment_id"),
        CONSTRAINT "fk_participations_opportunity" FOREIGN KEY ("opportunity_id")
          REFERENCES "opportunities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_participations_enrollment" FOREIGN KEY ("enrollment_id")
          REFERENCES "enrollments"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_participations_opportunity" ON "participations" ("opportunity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_participations_enrollment" ON "participations" ("enrollment_id")`);
    await queryRunner.query(`CREATE INDEX "idx_participations_team_leader" ON "participations" ("team_leader_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_participations_status" ON "participations" ("status")`);

    // ---- submissions ----
    await queryRunner.query(`
      CREATE TABLE "submissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "participation_id" uuid NOT NULL,
        "submitted_by" uuid NOT NULL,
        "description" text DEFAULT NULL,
        "external_links" jsonb DEFAULT NULL,
        "submitted_at" timestamptz NOT NULL DEFAULT NOW(),
        "is_late" boolean NOT NULL DEFAULT false,
        "rejection_reason" text DEFAULT NULL,
        CONSTRAINT "pk_submissions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_submissions_participation" FOREIGN KEY ("participation_id")
          REFERENCES "participations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_submissions_submitted_by" FOREIGN KEY ("submitted_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_submissions_participation" ON "submissions" ("participation_id")`);
    await queryRunner.query(`CREATE INDEX "idx_submissions_submitted_by" ON "submissions" ("submitted_by")`);
    await queryRunner.query(`CREATE INDEX "idx_submissions_submitted_at" ON "submissions" ("submitted_at")`);

    // ---- submission_files ----
    await queryRunner.query(`
      CREATE TABLE "submission_files" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "submission_id" uuid NOT NULL,
        "file_reference_id" uuid NOT NULL,
        CONSTRAINT "pk_submission_files" PRIMARY KEY ("id"),
        CONSTRAINT "fk_submission_files_submission" FOREIGN KEY ("submission_id")
          REFERENCES "submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_submission_files_file_reference" FOREIGN KEY ("file_reference_id")
          REFERENCES "file_references"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_submission_files_submission" ON "submission_files" ("submission_id")`);
    await queryRunner.query(`CREATE INDEX "idx_submission_files_file_ref" ON "submission_files" ("file_reference_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "submission_files" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "participations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_references" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunities" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."participation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."opportunity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."opportunity_state_enum"`);
  }
}
