import { OrganizationStatus } from '../../entities/organization.entity';

export class OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  databaseName: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

