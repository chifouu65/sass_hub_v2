import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationRoleDto } from './create-organization-role.dto';

export class UpdateOrganizationRoleDto extends PartialType(CreateOrganizationRoleDto) {}

