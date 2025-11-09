import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import {
  TENANT_SERVICE_BASE_URL,
  TenantServiceClient,
} from './tenant-service.client';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationRolesService,
    TenantServiceClient,
    {
      provide: TENANT_SERVICE_BASE_URL,
      useFactory: () =>
        process.env.TENANT_SERVICE_URL ?? 'http://localhost:3002/api',
    },
  ],
  exports: [OrganizationsService, OrganizationRolesService],
})
export class OrganizationsModule {}

