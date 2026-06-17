import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFoundationTables1718550000000 implements MigrationInterface {
  name = 'CreateFoundationTables1718550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUMs for user roles and academic types
    await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'mentor', 'team_leader')`);
    await queryRunner.query(`CREATE TYPE "public"."role_scope_type_enum" AS ENUM('global', 'section', 'group', 'opportunity')`);
    await queryRunner.query(`CREATE TYPE "public"."academic_period_type_enum" AS ENUM('semester', 'trimester', 'term')`);

    // Create uuid-ossp extension for gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---- users ----
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "email" varchar(320) NOT NULL,
        "password_hash" text NOT NULL,
        "name" varchar(255) NOT NULL,
        "contact_phone" varchar(50) DEFAULT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )`);

    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_is_active" ON "users" ("is_active")`);

    // ---- academic_years ----
    await queryRunner.query(`
      CREATE TABLE "academic_years" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "label" varchar(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_academic_years" PRIMARY KEY ("id"),
        CONSTRAINT "uq_academic_years_label" UNIQUE ("label")
      )`);

    await queryRunner.query(`CREATE INDEX "idx_academic_years_is_active" ON "academic_years" ("is_active")`);

    // ---- branches ----
    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "code" varchar(20) NOT NULL,
        "name" varchar(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_branches" PRIMARY KEY ("id"),
        CONSTRAINT "uq_branches_code" UNIQUE ("code")
      )`);

    await queryRunner.query(`CREATE INDEX "idx_branches_code" ON "branches" ("code")`);

    // ---- academic_periods ----
    await queryRunner.query(`
      CREATE TABLE "academic_periods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "academic_year_id" uuid NOT NULL,
        "label" varchar(100) NOT NULL,
        "type" "public"."academic_period_type_enum" NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_academic_periods" PRIMARY KEY ("id"),
        CONSTRAINT "ck_academic_periods_dates" CHECK ("end_date" > "start_date"),
        CONSTRAINT "fk_academic_periods_academic_year" FOREIGN KEY ("academic_year_id")
          REFERENCES "academic_years"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_academic_periods_academic_year" ON "academic_periods" ("academic_year_id")`);
    await queryRunner.query(`CREATE INDEX "idx_academic_periods_is_active" ON "academic_periods" ("is_active")`);

    // ---- sections ----
    await queryRunner.query(`
      CREATE TABLE "sections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "branch_id" uuid NOT NULL,
        "academic_period_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "mentor_user_id" uuid DEFAULT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_sections" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sections_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sections_academic_period" FOREIGN KEY ("academic_period_id")
          REFERENCES "academic_periods"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_sections_branch" ON "sections" ("branch_id")`);
    await queryRunner.query(`CREATE INDEX "idx_sections_academic_period" ON "sections" ("academic_period_id")`);
    await queryRunner.query(`CREATE INDEX "idx_sections_mentor" ON "sections" ("mentor_user_id")`);

    // ---- batches ----
    await queryRunner.query(`
      CREATE TABLE "batches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "academic_year_id" uuid NOT NULL,
        "label" varchar(50) NOT NULL,
        "graduation_year" integer NOT NULL,
        CONSTRAINT "pk_batches" PRIMARY KEY ("id"),
        CONSTRAINT "fk_batches_academic_year" FOREIGN KEY ("academic_year_id")
          REFERENCES "academic_years"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_batches_academic_year" ON "batches" ("academic_year_id")`);

    // ---- groups ----
    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "section_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "team_leader_user_id" uuid DEFAULT NULL,
        CONSTRAINT "pk_groups" PRIMARY KEY ("id"),
        CONSTRAINT "fk_groups_section" FOREIGN KEY ("section_id")
          REFERENCES "sections"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_groups_section" ON "groups" ("section_id")`);
    await queryRunner.query(`CREATE INDEX "idx_groups_team_leader" ON "groups" ("team_leader_user_id")`);

    // ---- enrollments ----
    await queryRunner.query(`
      CREATE TABLE "enrollments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "user_id" uuid NOT NULL,
        "academic_period_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "section_id" uuid NOT NULL,
        "batch_id" uuid NOT NULL,
        "group_id" uuid DEFAULT NULL,
        "roll_number" varchar(50) DEFAULT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "enrolled_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_enrollments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_enrollments_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_enrollments_academic_period" FOREIGN KEY ("academic_period_id")
          REFERENCES "academic_periods"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_enrollments_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_enrollments_section" FOREIGN KEY ("section_id")
          REFERENCES "sections"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_enrollments_batch" FOREIGN KEY ("batch_id")
          REFERENCES "batches"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_enrollments_group" FOREIGN KEY ("group_id")
          REFERENCES "groups"("id") ON DELETE SET NULL
      )`);

    await queryRunner.query(`CREATE INDEX "idx_enrollments_user" ON "enrollments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_enrollments_academic_period" ON "enrollments" ("academic_period_id")`);
    await queryRunner.query(`CREATE INDEX "idx_enrollments_section" ON "enrollments" ("section_id")`);
    await queryRunner.query(`CREATE INDEX "idx_enrollments_batch" ON "enrollments" ("batch_id")`);
    await queryRunner.query(`CREATE INDEX "idx_enrollments_is_active" ON "enrollments" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "batches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sections" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "branches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_years" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."academic_period_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."role_scope_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
  }
}
