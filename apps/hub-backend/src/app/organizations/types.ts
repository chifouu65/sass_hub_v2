import { ApplicationStatus, SubscriptionStatus } from '@sass-hub-v2/shared-types';
import { UserOrganizationRole } from './constants/user-organization-role.enum';

export enum PermissionCode {
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_APPS = 'manage_apps',
  MANAGE_BILLING = 'manage_billing',
  VIEW_REPORTS = 'view_reports',
  VIEW_ONLY = 'view_only',
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export interface TenantPermission {
  id: string;
  code: PermissionCode;
  name: string;
  description: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TenantOrganizationRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string | null;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  permissions: PermissionCode[];
}

export interface OrganizationMembershipResponse {
  id: string;
  organizationId: string;
  userId: string;
  role: UserOrganizationRole | null;
  organizationRoleId: string | null;
  organizationRoleSlug: string | null;
  organizationRoleName: string | null;
  permissions: PermissionCode[];
  createdAt: Date | string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface TenantOrganizationApplication {
  subscriptionId: string;
  organizationId: string;
  applicationId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  applicationStatus: ApplicationStatus;
  subscriptionStatus: SubscriptionStatus;
  subscribedAt: string | Date;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  updatedAt: string | Date;
}

export interface TenantApplication {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  status: ApplicationStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}
