import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImportHistoryTable1718550000009 implements MigrationInterface {
  name = 'CreateImportHistoryTable1718550000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "import_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "import_type" varchar(20) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "status" varchar(10) NOT NULL,
        "total_rows" int NOT NULL,
        "success_count" int NOT NULL,
        "failure_count" int NOT NULL,
        "errors" jsonb DEFAULT NULL,
        "imported_by" uuid DEFAULT NULL,
        CONSTRAINT "pk_import_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_import_history_imported_by" FOREIGN KEY ("imported_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )`);

    await queryRunner.query(`CREATE INDEX "idx_import_history_type" ON "import_history" ("import_type")`);
    await queryRunner.query(`CREATE INDEX "idx_import_history_imported_by" ON "import_history" ("imported_by")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "import_history" CASCADE`);
  }
}
