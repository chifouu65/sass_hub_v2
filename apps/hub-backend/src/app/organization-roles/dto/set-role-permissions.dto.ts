import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { PermissionCode } from '../../entities/permission.entity';

export class SetRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionCode, { each: true })
  permissions: PermissionCode[];
}

