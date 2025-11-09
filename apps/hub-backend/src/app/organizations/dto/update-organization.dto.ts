import { IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';
import { OrganizationStatus } from '../types';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;
}

