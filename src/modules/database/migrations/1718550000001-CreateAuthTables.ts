import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1718550000001 implements MigrationInterface {
  name = 'CreateAuthTables1718550000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- role_assignments ----
    await queryRunner.query(`
      CREATE TABLE "role_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "user_id" uuid NOT NULL,
        "role" "public"."user_role_enum" NOT NULL,
        "scope_type" "public"."role_scope_type_enum" NOT NULL,
        "scope_id" uuid DEFAULT NULL,
        "granted_by" uuid NOT NULL,
        "valid_from" timestamptz NOT NULL DEFAULT NOW(),
        "valid_to" timestamptz DEFAULT NULL,
        CONSTRAINT "pk_role_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "ck_role_assignments_valid_range" CHECK ("valid_to" IS NULL OR "valid_to" > "valid_from"),
        CONSTRAINT "ck_role_assignments_scope_id" CHECK (
          ("scope_type" = 'global' AND "scope_id" IS NULL)
          OR ("scope_type" != 'global' AND "scope_id" IS NOT NULL)
        ),
        CONSTRAINT "fk_role_assignments_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_assignments_granted_by" FOREIGN KEY ("granted_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_role_assignments_user" ON "role_assignments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_role_assignments_role_scope" ON "role_assignments" ("role", "scope_type", "scope_id")`);

    // ---- refresh_tokens ----
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz DEFAULT NULL,
        "family" varchar(32) NOT NULL,
        CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "ck_refresh_tokens_expiry" CHECK ("expires_at" > "created_at"),
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_revoked" ON "refresh_tokens" ("revoked_at")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" ("token_hash")`);

    // ---- password_reset_tokens ----
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz DEFAULT NULL,
        CONSTRAINT "pk_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "ck_password_reset_tokens_expiry" CHECK ("expires_at" > "created_at"),
        CONSTRAINT "fk_password_reset_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_password_reset_tokens_user" ON "password_reset_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_password_reset_tokens_expires" ON "password_reset_tokens" ("expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_assignments" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."role_scope_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
  }
}
