import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationRole } from '../entities/organization-role.entity';
import { OrganizationRolePermission } from '../entities/organization-role-permission.entity';
import { Permission } from '../entities/permission.entity';
import { OrganizationRolesService } from './organization-roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationRole,
      OrganizationRolePermission,
      Permission,
    ]),
  ],
  providers: [OrganizationRolesService],
  exports: [OrganizationRolesService],
})
export class OrganizationRolesModule {}

