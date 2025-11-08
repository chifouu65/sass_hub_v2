/**
 * Built-in roles available for members within an organization.
 * These roles are meant to cover the most common scenarios and can
 * co-exist with custom roles defined per organization.
 */
export enum UserOrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export const BUILT_IN_ORGANIZATION_ROLES: UserOrganizationRole[] = [
  UserOrganizationRole.OWNER,
  UserOrganizationRole.ADMIN,
  UserOrganizationRole.MEMBER,
  UserOrganizationRole.VIEWER,
];

