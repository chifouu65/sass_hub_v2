import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrganizationStatus } from '../../entities/organization.entity';

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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  databaseName?: string;

  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;
}

