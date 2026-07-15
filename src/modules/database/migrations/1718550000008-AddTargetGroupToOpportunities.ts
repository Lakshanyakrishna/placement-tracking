import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetGroupToOpportunities1718550000008 implements MigrationInterface {
  name = 'AddTargetGroupToOpportunities1718550000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunities" ADD COLUMN "target_group_id" uuid DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "opportunities" DROP COLUMN "target_group_id"`);
  }
}
