export type UUID = string;
export type ISODateString = string;

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
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
