import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationRoles1720470650000
  implements MigrationInterface
{
  name = 'AddOrganizationRoles1720470650000';

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`organization_role_permissions\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`organization_roles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`permissions\``);

    await queryRunner.query(`
      CREATE TABLE \`permissions\` (
        \`id\` varchar(36) NOT NULL,
        \`code\` varchar(150) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` varchar(500) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_permissions_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`organization_roles\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`slug\` varchar(150) NOT NULL,
        \`description\` varchar(500) NULL,
        \`organization_id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        \`is_system\` tinyint NOT NULL DEFAULT 0,
        \`is_default\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_organization_roles_org_slug\` (\`organization_id\`, \`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`organization_role_permissions\` (
        \`id\` varchar(36) NOT NULL,
        \`role_id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`permission_id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_role_permission_unique\` (\`role_id\`, \`permission_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const hasOrganizationRoleColumn = await queryRunner.hasColumn(
      'user_organizations',
      'organization_role_id',
    );
    if (hasOrganizationRoleColumn) {
      await queryRunner.dropColumn('user_organizations', 'organization_role_id');
    }

    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      ADD \`organization_role_id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      MODIFY \`role\` varchar(50) NULL DEFAULT 'member'
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_roles\`
      ADD CONSTRAINT \`FK_f64903b60a78457e18be19fb74f\`
      FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_role_permissions\`
      ADD CONSTRAINT \`FK_role_permissions_role\`
      FOREIGN KEY (\`role_id\`) REFERENCES \`organization_roles\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_role_permissions\`
      ADD CONSTRAINT \`FK_role_permissions_permission\`
      FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      ADD CONSTRAINT \`FK_6a3eb52e83072f9f878ecfbed81\`
      FOREIGN KEY (\`organization_role_id\`) REFERENCES \`organization_roles\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      DROP FOREIGN KEY \`FK_6a3eb52e83072f9f878ecfbed81\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_role_permissions\`
      DROP FOREIGN KEY \`FK_role_permissions_permission\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_role_permissions\`
      DROP FOREIGN KEY \`FK_role_permissions_role\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`organization_roles\`
      DROP FOREIGN KEY \`FK_f64903b60a78457e18be19fb74f\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      MODIFY \`role\` varchar(50) NOT NULL DEFAULT 'member'
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_organizations\`
      DROP COLUMN \`organization_role_id\`
    `);

    await queryRunner.query(`
      DROP TABLE \`organization_role_permissions\`
    `);

    await queryRunner.query(`
      DROP TABLE \`organization_roles\`
    `);

    await queryRunner.query(`
      DROP TABLE \`permissions\`
    `);
    }

}
