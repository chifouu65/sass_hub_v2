import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { PermissionCode } from '../../organizations/types';

export class SetRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionCode, { each: true })
  permissions: PermissionCode[];
}

