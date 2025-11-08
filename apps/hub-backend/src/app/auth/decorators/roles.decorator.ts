import { SetMetadata } from '@nestjs/common';
import { UserOrganizationRole } from '../../organizations/constants/user-organization-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserOrganizationRole[]) => SetMetadata(ROLES_KEY, roles);

