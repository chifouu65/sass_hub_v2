import { Injectable } from '@nestjs/common';
import { TenantServiceClient } from '../organizations/tenant-service.client';
import { CreateOrganizationRoleDto } from './dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from './dto/update-organization-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import {
  OrganizationMembershipResponse,
  PermissionCode,
} from '../organizations/types';

@Injectable()
export class OrganizationRolesService {
  constructor(private readonly tenantClient: TenantServiceClient) {}

  listOrganizationRoles(organizationId: string) {
    return this.tenantClient.listOrganizationRoles(organizationId);
  }

  listPermissions(organizationId: string) {
    return this.tenantClient.listAvailablePermissions(organizationId);
  }

  createRole(organizationId: string, dto: CreateOrganizationRoleDto) {
    return this.tenantClient.createRole(organizationId, dto);
  }

  updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateOrganizationRoleDto,
  ) {
    return this.tenantClient.updateRole(organizationId, roleId, dto);
  }

  setRolePermissions(
    organizationId: string,
    roleId: string,
    dto: SetRolePermissionsDto,
  ) {
    return this.tenantClient.setRolePermissions(organizationId, roleId, dto);
  }

  deleteRole(organizationId: string, roleId: string) {
    return this.tenantClient.deleteRole(organizationId, roleId);
  }

  getEffectivePermissionsForMembership(
    membership: OrganizationMembershipResponse,
  ): PermissionCode[] {
    return membership.permissions ?? [];
  }
}

