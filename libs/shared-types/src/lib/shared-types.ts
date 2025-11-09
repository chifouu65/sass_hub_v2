export type UUID = string;
export type ISODateString = string;

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ApplicationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BETA = 'beta',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export interface OrganizationSummary {
  id: UUID;
  name: string;
  slug: string;
  databaseName: string;
  status: OrganizationStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PermissionView {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrganizationRoleView {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  organizationId: UUID | null;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  permissions: string[];
}

export interface OrganizationMemberView {
  id: UUID;
  userId: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  organizationRoleId: UUID | null;
  organizationRoleSlug: string | null;
  organizationRoleName: string | null;
  createdAt: ISODateString;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  ownerId?: UUID;
  databaseName?: string | null;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  databaseName?: string | null;
  status?: OrganizationStatus;
}

export interface CreateOrganizationRoleRequest {
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
}

export interface UpdateOrganizationRoleRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  isDefault?: boolean;
  permissions?: string[];
}

export interface AddOrganizationMemberRequest {
  userId?: UUID;
  email?: string;
  role?: string;
  organizationRoleId?: UUID | null;
}

export interface UpdateOrganizationMemberRoleRequest {
  role?: string;
  organizationRoleId?: UUID | null;
}

export interface PageRequest {
  page?: number | string;
  perPage?: number | string;
  search?: string | null;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | readonly (string | number | boolean | null | undefined)[];
}

export interface NormalizedPageRequest {
  page: number;
  perPage: number;
  search: string | null;
}

export interface PaginatedMeta {
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface AuthOrganizationLink {
  id: UUID;
  name: string;
  slug: string;
  role: string | null;
}

export interface AuthenticatedUserView {
  id: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizations: AuthOrganizationLink[];
  roles: string[];
  permissions: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateString;
  user: AuthenticatedUserView;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  expiresAt: ISODateString;
}

export interface AuthValidateTokenRequest {
  accessToken: string;
}

export interface AuthValidateTokenResponse {
  valid: boolean;
  expiresAt: ISODateString | null;
}

export interface SubscribedApplicationView {
  subscriptionId: UUID;
  organizationId: UUID;
  applicationId: UUID;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  applicationStatus: ApplicationStatus;
  subscriptionStatus: SubscriptionStatus;
  subscribedAt: ISODateString;
  startsAt: ISODateString | null;
  endsAt: ISODateString | null;
  updatedAt: ISODateString;
}

export interface AvailableApplicationView {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  status: ApplicationStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type TenantOrganizationSummary = OrganizationSummary;
export type TenantOrganizationRole = OrganizationRoleView;
export type TenantOrganizationMember = OrganizationMemberView;
export type TenantPermissionView = PermissionView;
export type TenantSubscribedApplicationView = SubscribedApplicationView;
export type TenantAvailableApplicationView = AvailableApplicationView;

export type TenantCreateOrganizationRequest = CreateOrganizationRequest;
export type TenantUpdateOrganizationRequest = UpdateOrganizationRequest;
export type TenantCreateRoleRequest = CreateOrganizationRoleRequest;
export type TenantUpdateRoleRequest = UpdateOrganizationRoleRequest;
export type TenantAddMemberRequest = AddOrganizationMemberRequest;
export type TenantUpdateMemberRoleRequest = UpdateOrganizationMemberRoleRequest;

export type TenantListOrganizationsResponse = PaginatedResult<TenantOrganizationSummary>;
export interface TenantGetOrganizationResponse {
  organization: TenantOrganizationSummary;
  roles: TenantOrganizationRole[];
  members: TenantOrganizationMember[];
  applications: TenantSubscribedApplicationView[];
}
export type TenantListRolesResponse = PaginatedResult<TenantOrganizationRole>;
export interface TenantListPermissionsResponse {
  data: TenantPermissionView[];
}
export type TenantListMembersResponse = PaginatedResult<TenantOrganizationMember>;
