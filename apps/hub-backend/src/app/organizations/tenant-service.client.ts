import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateOrganizationRoleDto } from '../organization-roles/dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from '../organization-roles/dto/update-organization-role.dto';
import { SetRolePermissionsDto } from '../organization-roles/dto/set-role-permissions.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import type {
  OrganizationMembershipResponse,
  TenantOrganizationRole,
  TenantPermission,
} from './types';
import { AxiosError, AxiosResponse } from 'axios';

export const TENANT_SERVICE_BASE_URL = 'TENANT_SERVICE_BASE_URL';

@Injectable()
export class TenantServiceClient {
  private readonly logger = new Logger(TenantServiceClient.name);

  constructor(
    private readonly http: HttpService,
    @Inject(TENANT_SERVICE_BASE_URL) private readonly baseUrl: string,
  ) {}

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
  ): Promise<T> {
    try {
      const response = await lastValueFrom<AxiosResponse<T>>(
        this.http.request<T>({
          method,
          url: `${this.baseUrl}${path}`,
          data,
        }),
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (this.isAxiosError(error)) {
        const status =
          error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        const message = this.extractErrorMessage(error);

        if (status >= 500) {
          this.logger.error(
            `Tenant service error ${status} on ${method} ${path}: ${message}`,
          );
        }

        throw new HttpException(message, status);
      }

      throw new HttpException(
        'Erreur interne lors de la communication avec le tenant service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private isAxiosError(
    error: unknown,
  ): error is AxiosError<{ message?: unknown } | string | undefined> {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      Boolean((error as { isAxiosError?: boolean }).isAxiosError)
    );
  }

  private extractErrorMessage(
    error: AxiosError<{ message?: unknown } | string | undefined>,
  ): string {
    const responseData = error.response?.data;

    if (typeof responseData === 'string') {
      return responseData.trim().length > 0
        ? responseData
        : error.message || 'Erreur inconnue du tenant service';
    }

    if (responseData && typeof responseData === 'object') {
      const rawMessage = (responseData as { message?: unknown }).message;

      if (Array.isArray(rawMessage)) {
        return rawMessage.join('; ');
      }

      if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
        return rawMessage;
      }
    }

    if (!responseData) {
      return error.message || 'Erreur inconnue du tenant service';
    }

    return error.message || 'Erreur inconnue du tenant service';
  }

  createOrganization(dto: CreateOrganizationDto & { ownerId: string }) {
    return this.request<OrganizationResponseDto>('POST', `/organizations`, dto);
  }

  listOrganizations() {
    return this.request<OrganizationResponseDto[]>(`GET`, `/organizations`);
  }

  getOrganizationById(id: string) {
    return this.request<OrganizationResponseDto>(`GET`, `/organizations/${id}`);
  }

  getOrganizationBySlug(slug: string) {
    return this.request<OrganizationResponseDto>(
      `GET`,
      `/organizations/slug/${slug}`,
    );
  }

  getOrganizationsForUser(userId: string) {
    return this.request<OrganizationResponseDto[]>(
      `GET`,
      `/organizations/user/${userId}`,
    );
  }

  updateOrganization(id: string, dto: UpdateOrganizationDto) {
    return this.request<OrganizationResponseDto>(
      `PATCH`,
      `/organizations/${id}`,
      dto,
    );
  }

  deleteOrganization(id: string) {
    return this.request<void>(`DELETE`, `/organizations/${id}`);
  }

  addUserToOrganization(id: string, dto: AddUserToOrganizationDto) {
    return this.request<void>(`POST`, `/organizations/${id}/users`, dto);
  }

  getOrganizationUsers(id: string) {
    return this.request<OrganizationMembershipResponse[]>(
      `GET`,
      `/organizations/${id}/users`,
    );
  }

  updateUserRole(id: string, userId: string, dto: UpdateUserRoleDto) {
    return this.request<void>(
      `PATCH`,
      `/organizations/${id}/users/${userId}/role`,
      dto,
    );
  }

  removeUserFromOrganization(id: string, userId: string) {
    return this.request<void>(`DELETE`, `/organizations/${id}/users/${userId}`);
  }

  listOrganizationRoles(id: string) {
    return this.request<TenantOrganizationRole[]>(
      `GET`,
      `/organizations/${id}/roles`,
    );
  }

  listAvailablePermissions(id: string) {
    return this.request<TenantPermission[]>(
      `GET`,
      `/organizations/${id}/roles/available-permissions`,
    );
  }

  createRole(id: string, dto: CreateOrganizationRoleDto) {
    return this.request<TenantOrganizationRole>(
      `POST`,
      `/organizations/${id}/roles`,
      dto,
    );
  }

  updateRole(id: string, roleId: string, dto: UpdateOrganizationRoleDto) {
    return this.request<TenantOrganizationRole>(
      `PATCH`,
      `/organizations/${id}/roles/${roleId}`,
      dto,
    );
  }

  setRolePermissions(
    id: string,
    roleId: string,
    dto: SetRolePermissionsDto,
  ) {
    return this.request<TenantOrganizationRole>(
      `PUT`,
      `/organizations/${id}/roles/${roleId}/permissions`,
      dto,
    );
  }

  deleteRole(id: string, roleId: string) {
    return this.request<void>(`DELETE`, `/organizations/${id}/roles/${roleId}`);
  }

  getOrganizationMembership(id: string, userId: string) {
    return this.request<OrganizationMembershipResponse | null>(
      `GET`,
      `/organizations/${id}/users/${userId}`,
    );
  }
}

