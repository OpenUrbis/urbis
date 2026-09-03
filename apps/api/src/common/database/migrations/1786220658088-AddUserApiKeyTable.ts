import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserApiKeyTable1786220658088 implements MigrationInterface {
  name = 'AddUserApiKeyTable1786220658088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_commonRefAbbr"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_complementAbbr"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_startDate"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_authorId"`);
    await queryRunner.query(
      `CREATE TABLE "user_api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "hashedKey" character varying NOT NULL, "prefix" character varying NOT NULL, "lastUsedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cb526e71612bb5b9a84be48cde" ON "user_api_keys" ("hashedKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e131705cbbc8fb589889b02d45" ON "user_api_keys" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_status_enum" RENAME TO "users_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'in_analysis')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "lastGovBrLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastGovBrLoginAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "govBrFirstLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "govBrFirstLoginAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDate"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "birthDate" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TYPE "public"."map_config_type_enum" RENAME TO "map_config_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."map_config_type_enum" AS ENUM('literal-number', 'literal-string', 'array', 'object', 'view-template')`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" TYPE "public"."map_config_type_enum" USING "type"::"text"::"public"."map_config_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" SET DEFAULT 'object'`,
    );
    await queryRunner.query(`DROP TYPE "public"."map_config_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "legis_pages" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_230b925048540454c8b4c481e1" ON "users" ("cpf") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da5f4d28dd77dbb5b152b02cde" ON "legis_pages" ("authorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD CONSTRAINT "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP CONSTRAINT "FK_e131705cbbc8fb589889b02d457"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da5f4d28dd77dbb5b152b02cde"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_230b925048540454c8b4c481e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legis_pages" ALTER COLUMN "tags" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."map_config_type_enum_old" AS ENUM('literal-number', 'literal-string', 'array', 'object', 'view-template')`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" TYPE "public"."map_config_type_enum_old" USING "type"::"text"::"public"."map_config_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" SET DEFAULT 'object'`,
    );
    await queryRunner.query(`DROP TYPE "public"."map_config_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."map_config_type_enum_old" RENAME TO "map_config_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDate"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "birthDate" date`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "govBrFirstLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "govBrFirstLoginAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "lastGovBrLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastGovBrLoginAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum_old" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum_old" USING "status"::"text"::"public"."users_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_status_enum_old" RENAME TO "users_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e131705cbbc8fb589889b02d45"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb526e71612bb5b9a84be48cde"`,
    );
    await queryRunner.query(`DROP TABLE "user_api_keys"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_authorId" ON "legis_pages" ("authorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_startDate" ON "legis_authorities" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_complementAbbr" ON "legis_authorities" ("complementAbbr") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_commonRefAbbr" ON "legis_authorities" ("commonRefAbbr") `,
    );
  }
}
