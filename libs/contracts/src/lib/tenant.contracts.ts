import {
  AddOrganizationMemberRequest,
  CreateOrganizationRequest,
  CreateOrganizationRoleRequest,
  OrganizationMemberView,
  OrganizationRoleView,
  OrganizationSummary,
  PermissionView,
  UpdateOrganizationMemberRoleRequest,
  UpdateOrganizationRequest,
  UpdateOrganizationRoleRequest,
} from '@sass-hub-v2/shared-types';
import { PaginatedResult } from './pagination';

export type TenantCreateOrganizationRequest = CreateOrganizationRequest;
export type TenantUpdateOrganizationRequest = UpdateOrganizationRequest;
export type TenantCreateRoleRequest = CreateOrganizationRoleRequest;
export type TenantUpdateRoleRequest = UpdateOrganizationRoleRequest;
export type TenantAddMemberRequest = AddOrganizationMemberRequest;
export type TenantUpdateMemberRoleRequest = UpdateOrganizationMemberRoleRequest;

export type TenantOrganizationSummary = OrganizationSummary;
export type TenantOrganizationRole = OrganizationRoleView;
export type TenantOrganizationMember = OrganizationMemberView;
export type TenantPermission = PermissionView;

export interface TenantListOrganizationsResponse extends PaginatedResult<TenantOrganizationSummary> {}

export interface TenantGetOrganizationResponse {
  organization: TenantOrganizationSummary;
  roles: TenantOrganizationRole[];
  members: TenantOrganizationMember[];
}

export interface TenantListRolesResponse extends PaginatedResult<TenantOrganizationRole> {}

export interface TenantListPermissionsResponse {
  data: TenantPermission[];
}

export interface TenantListMembersResponse extends PaginatedResult<TenantOrganizationMember> {}

