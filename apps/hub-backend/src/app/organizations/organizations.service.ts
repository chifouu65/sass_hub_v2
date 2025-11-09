import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { TenantServiceClient } from './tenant-service.client';
import { OrganizationMembershipResponse } from './types';

@Injectable()
export class OrganizationsService {
  constructor(private readonly tenantClient: TenantServiceClient) {}

  create(
    createDto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<OrganizationResponseDto> {
    return this.tenantClient.createOrganization({ ...createDto, ownerId });
  }

  findAll(): Promise<OrganizationResponseDto[]> {
    return this.tenantClient.listOrganizations();
  }

  findOne(id: string): Promise<OrganizationResponseDto> {
    return this.tenantClient.getOrganizationById(id);
  }

  findBySlug(slug: string): Promise<OrganizationResponseDto> {
    return this.tenantClient.getOrganizationBySlug(slug);
  }

  findByUser(userId: string): Promise<OrganizationResponseDto[]> {
    return this.tenantClient.getOrganizationsForUser(userId);
  }

  update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationResponseDto> {
    return this.tenantClient.updateOrganization(id, dto);
  }

  remove(id: string): Promise<void> {
    return this.tenantClient.deleteOrganization(id);
  }

  async addUserToOrganization(
    organizationId: string,
    identifier: { userId?: string; email?: string },
    options: { role?: UserOrganizationRole; organizationRoleId?: string } = {},
  ): Promise<void> {
    const payload: AddUserToOrganizationDto = {
      userId: identifier.userId,
      email: identifier.email,
      role: options.role,
      organizationRoleId: options.organizationRoleId,
    };

    await this.tenantClient.addUserToOrganization(organizationId, payload);
  }

  getOrganizationUsers(
    organizationId: string,
  ): Promise<OrganizationMembershipResponse[]> {
    return this.tenantClient.getOrganizationUsers(organizationId);
  }

  async updateUserRole(
    organizationId: string,
    userId: string,
    updateDto: UpdateUserRoleDto,
  ): Promise<void> {
    await this.tenantClient.updateUserRole(organizationId, userId, updateDto);
  }

  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.tenantClient.removeUserFromOrganization(organizationId, userId);
  }

  async isUserMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.getUserOrganizationMembership(
      organizationId,
      userId,
    );
    return membership !== null;
  }

  async hasUserRole(
    userId: string,
    organizationId: string,
    role: UserOrganizationRole,
  ): Promise<boolean> {
    const membership = await this.getUserOrganizationMembership(
      organizationId,
      userId,
    );

    if (!membership) {
      return false;
    }

    return membership.role === role;
  }

  async getUserRole(organizationId: string, userId: string): Promise<string | null> {
    const membership = await this.getUserOrganizationMembership(
      organizationId,
      userId,
    );

    if (!membership) {
      return null;
    }

    return membership.role ?? membership.organizationRoleSlug ?? null;
  }

  getUserOrganizationMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembershipResponse | null> {
    return this.tenantClient.getOrganizationMembership(organizationId, userId);
  }
}

