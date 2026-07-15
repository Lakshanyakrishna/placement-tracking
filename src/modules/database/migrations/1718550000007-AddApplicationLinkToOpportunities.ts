import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationLinkToOpportunities1718550000007 implements MigrationInterface {
  name = 'AddApplicationLinkToOpportunities1718550000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunities" ADD COLUMN "application_link" varchar(2048) DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "opportunities" DROP COLUMN "application_link"`);
  }
}
