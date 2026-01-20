import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTicketsTable1768892848706 implements MigrationInterface {
  name = 'CreateSupportTicketsTable1768892848706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE support_ticket_seq START 1 MINVALUE 0`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION generate_support_ticket_id()
      RETURNS text AS $$
      DECLARE
          seq_val BIGINT;
          number_part INT;
          letter_val INT;
          char1 CHAR;
          char2 CHAR;
      BEGIN
          seq_val := nextval('support_ticket_seq');
          number_part := (seq_val % 9999) + 1;
          letter_val := floor(seq_val / 9999);
          
          letter_val := letter_val % 676;
          
          char1 := chr(65 + floor(letter_val / 26)::int);
          char2 := chr(65 + (letter_val % 26)::int);
          
          RETURN to_char(number_part, 'fm0000') || '-' || char1 || char2;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(
      `CREATE TABLE "support_tickets" ("id" character varying NOT NULL DEFAULT generate_support_ticket_id(), "name" character varying NOT NULL, "email" character varying NOT NULL, "message" character varying NOT NULL, "files" text array, "type" character varying NOT NULL, CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "support_tickets"`);
    await queryRunner.query(`DROP FUNCTION generate_support_ticket_id`);
    await queryRunner.query(`DROP SEQUENCE support_ticket_seq`);
  }
}
