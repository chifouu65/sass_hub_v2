import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { PermissionCode } from '../../organizations/types';

export class CreateOrganizationRoleDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsString()
  @Length(2, 150)
  slug: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  @IsOptional()
  @IsEnum(PermissionCode, { each: true })
  permissions?: PermissionCode[];

  @IsUUID()
  @IsOptional()
  baseRoleId?: string;
}

