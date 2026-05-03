import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsDefaultToRoles1768000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("roles", new TableColumn({
            name: "is_default",
            type: "boolean",
            default: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("roles", "is_default");
    }
}
