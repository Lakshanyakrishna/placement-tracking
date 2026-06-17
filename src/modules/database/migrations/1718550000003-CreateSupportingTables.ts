import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportingTables1718550000003 implements MigrationInterface {
  name = 'CreateSupportingTables1718550000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUMs for supporting domain
    await queryRunner.query(`CREATE TYPE "public"."verification_action_enum" AS ENUM('submitted', 'verified', 'rejected', 'auto_verified', 'escalated', 'overridden', 'reminded')`);
    await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('submission_pending', 'submission_verified', 'submission_rejected', 'verification_escalated', 'opportunity_published', 'opportunity_opened', 'mentor_assigned', 'tl_assigned', 'deadline_reminder')`);
    await queryRunner.query(`CREATE TYPE "public"."notification_channel_enum" AS ENUM('in_app', 'email', 'both')`);
    await queryRunner.query(`CREATE TYPE "public"."notification_delivery_status_enum" AS ENUM('pending', 'delivered', 'failed')`);

    // ---- verification_logs ----
    await queryRunner.query(`
      CREATE TABLE "verification_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "submission_id" uuid NOT NULL,
        "action" "public"."verification_action_enum" NOT NULL,
        "actor_user_id" uuid DEFAULT NULL,
        "reason" text DEFAULT NULL,
        CONSTRAINT "pk_verification_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_verification_logs_submission" FOREIGN KEY ("submission_id")
          REFERENCES "submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_verification_logs_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )`);

    await queryRunner.query(`CREATE INDEX "idx_verification_logs_submission" ON "verification_logs" ("submission_id")`);
    await queryRunner.query(`CREATE INDEX "idx_verification_logs_actor" ON "verification_logs" ("actor_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_verification_logs_action" ON "verification_logs" ("action")`);

    // ---- notifications ----
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "user_id" uuid NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "channel" "public"."notification_channel_enum" NOT NULL DEFAULT 'in_app',
        "delivery_status" "public"."notification_delivery_status_enum" NOT NULL DEFAULT 'pending',
        "read_at" timestamptz DEFAULT NULL,
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_type" ON "notifications" ("type")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_unread" ON "notifications" ("user_id") WHERE "read_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_delivery_status" ON "notifications" ("delivery_status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_logs" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_delivery_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."verification_action_enum"`);
  }
}
