import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingLinkToOpportunities1718550000010 implements MigrationInterface {
  name = 'AddMeetingLinkToOpportunities1718550000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunities" ADD COLUMN "meeting_link" varchar(2048) DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "opportunities" DROP COLUMN "meeting_link"`);
  }
}
