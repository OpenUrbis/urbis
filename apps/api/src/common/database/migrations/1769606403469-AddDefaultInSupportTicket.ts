import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultInSupportTicket1769606403469 implements MigrationInterface {
  name = 'AddDefaultInSupportTicket1769606403469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "id" SET DEFAULT generate_support_ticket_id()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ALTER COLUMN "id" DROP DEFAULT`,
    );
  }
}
