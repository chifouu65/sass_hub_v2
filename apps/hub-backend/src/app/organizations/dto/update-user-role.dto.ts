import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserOrganizationRole } from '../constants/user-organization-role.enum';

export class UpdateUserRoleDto {
  @IsEnum(UserOrganizationRole)
  @IsOptional()
  role?: UserOrganizationRole;

  @IsUUID()
  @IsOptional()
  organizationRoleId?: string;
}

