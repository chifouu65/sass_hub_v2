import { SetMetadata } from '@nestjs/common';
import { UserOrganizationRole } from '../../organizations/dto/add-user-to-organization.dto';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserOrganizationRole[]) => SetMetadata(ROLES_KEY, roles);

