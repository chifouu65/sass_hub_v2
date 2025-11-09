import {
  PageRequest,
  TenantAddMemberRequest,
  TenantCreateOrganizationRequest,
  TenantCreateRoleRequest,
  TenantGetOrganizationResponse,
  TenantListMembersResponse,
  TenantListOrganizationsResponse,
  TenantListPermissionsResponse,
  TenantListRolesResponse,
  TenantUpdateMemberRoleRequest,
  TenantUpdateOrganizationRequest,
  TenantUpdateRoleRequest,
} from '@sass-hub-v2/contracts';
import { HttpClient } from './http-client';

export interface TenantClientConfig {
  basePath?: string;
}

export class TenantServiceClient {
  private readonly basePath: string;

  constructor(private readonly http: HttpClient, config: TenantClientConfig = {}) {
    this.basePath = config.basePath ?? '/api/organizations';
  }

  listOrganizations(params?: PageRequest): Promise<TenantListOrganizationsResponse> {
    return this.http.request<TenantListOrganizationsResponse>({
      method: 'GET',
      path: this.basePath,
      query: params,
    });
  }

  createOrganization(payload: TenantCreateOrganizationRequest) {
    return this.http.request<TenantGetOrganizationResponse>({
      method: 'POST',
      path: this.basePath,
      body: payload,
    });
  }

  getOrganization(organizationId: string): Promise<TenantGetOrganizationResponse> {
    return this.http.request<TenantGetOrganizationResponse>({
      method: 'GET',
      path: `${this.basePath}/${organizationId}`,
    });
  }

  updateOrganization(organizationId: string, payload: TenantUpdateOrganizationRequest) {
    return this.http.request<TenantGetOrganizationResponse>({
      method: 'PATCH',
      path: `${this.basePath}/${organizationId}`,
      body: payload,
    });
  }

  deleteOrganization(organizationId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `${this.basePath}/${organizationId}`,
    });
  }

  listRoles(organizationId: string, params?: PageRequest): Promise<TenantListRolesResponse> {
    return this.http.request<TenantListRolesResponse>({
      method: 'GET',
      path: `${this.basePath}/${organizationId}/roles`,
      query: params,
    });
  }

  createRole(organizationId: string, payload: TenantCreateRoleRequest) {
    return this.http.request<void>({
      method: 'POST',
      path: `${this.basePath}/${organizationId}/roles`,
      body: payload,
    });
  }

  updateRole(organizationId: string, roleId: string, payload: TenantUpdateRoleRequest) {
    return this.http.request<void>({
      method: 'PATCH',
      path: `${this.basePath}/${organizationId}/roles/${roleId}`,
      body: payload,
    });
  }

  deleteRole(organizationId: string, roleId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `${this.basePath}/${organizationId}/roles/${roleId}`,
    });
  }

  listPermissions(organizationId: string): Promise<TenantListPermissionsResponse> {
    return this.http.request<TenantListPermissionsResponse>({
      method: 'GET',
      path: `${this.basePath}/${organizationId}/permissions`,
    });
  }

  listMembers(organizationId: string, params?: PageRequest): Promise<TenantListMembersResponse> {
    return this.http.request<TenantListMembersResponse>({
      method: 'GET',
      path: `${this.basePath}/${organizationId}/members`,
      query: params,
    });
  }

  addMember(organizationId: string, payload: TenantAddMemberRequest) {
    return this.http.request<void>({
      method: 'POST',
      path: `${this.basePath}/${organizationId}/members`,
      body: payload,
    });
  }

  updateMemberRole(organizationId: string, memberId: string, payload: TenantUpdateMemberRoleRequest) {
    return this.http.request<void>({
      method: 'PATCH',
      path: `${this.basePath}/${organizationId}/members/${memberId}`,
      body: payload,
    });
  }

  removeMember(organizationId: string, memberId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `${this.basePath}/${organizationId}/members/${memberId}`,
    });
  }
}

