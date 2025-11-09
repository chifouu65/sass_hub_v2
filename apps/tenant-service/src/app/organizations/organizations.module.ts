import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantDbModule } from '@sass-hub-v2/tenant-db';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { User } from '../entities/user.entity';
import { OrganizationRolesModule } from '../organization-roles/organization-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserOrganization, User]),
    OrganizationRolesModule,
    TenantDbModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

