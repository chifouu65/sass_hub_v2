import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum UserOrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export class AddUserToOrganizationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(UserOrganizationRole)
  @IsOptional()
  role?: UserOrganizationRole;
}

