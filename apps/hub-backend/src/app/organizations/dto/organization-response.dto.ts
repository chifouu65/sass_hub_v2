import { OrganizationStatus } from '../types';

export class OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  databaseName: string;
  status: OrganizationStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

