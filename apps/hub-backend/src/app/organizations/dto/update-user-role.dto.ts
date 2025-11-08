import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserOrganizationRole } from './add-user-to-organization.dto';

export class UpdateUserRoleDto {
  @IsEnum(UserOrganizationRole)
  @IsNotEmpty()
  role: UserOrganizationRole;
}

