import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { User } from '../entities/user.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { OrganizationRolesModule } from '../organization-roles/organization-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserOrganization, User]),
    OrganizationRolesModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PermissionsGuard],
  exports: [OrganizationsService, PermissionsGuard],
})
export class OrganizationsModule {}

