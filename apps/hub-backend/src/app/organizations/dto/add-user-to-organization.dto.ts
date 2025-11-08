import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateIf,
  IsEmail,
} from 'class-validator';
import { UserOrganizationRole } from '../constants/user-organization-role.enum';

export class AddUserToOrganizationDto {
  @ValidateIf((dto) => !dto.email)
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @ValidateIf((dto) => !dto.userId)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserOrganizationRole)
  @IsOptional()
  role?: UserOrganizationRole;

  @IsUUID()
  @IsOptional()
  organizationRoleId?: string;
}

