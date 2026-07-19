import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpportunityRoundsTable1718550000011 implements MigrationInterface {
  name = 'CreateOpportunityRoundsTable1718550000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "opportunity_rounds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "opportunity_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "link" varchar(2048) DEFAULT NULL,
        "scheduled_at" timestamptz DEFAULT NULL,
        "notes" text NOT NULL DEFAULT '',
        "sequence" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_opportunity_rounds" PRIMARY KEY ("id"),
        CONSTRAINT "fk_opportunity_rounds_opportunity" FOREIGN KEY ("opportunity_id")
          REFERENCES "opportunities"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`CREATE INDEX "idx_opportunity_rounds_opportunity" ON "opportunity_rounds" ("opportunity_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunity_rounds" CASCADE`);
  }
}
