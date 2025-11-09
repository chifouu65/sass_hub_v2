import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SubscribeApplicationDto } from './dto/subscribe-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/types';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';
import { CreateOrganizationRoleDto } from '../organization-roles/dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from '../organization-roles/dto/update-organization-role.dto';
import { SetRolePermissionsDto } from '../organization-roles/dto/set-role-permissions.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  PermissionCode,
  TenantApplication,
  TenantOrganizationApplication,
  TenantOrganizationRole,
} from './types';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly organizationRolesService: OrganizationRolesService,
  ) {}

  /**
   * Créer une nouvelle organisation
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateOrganizationDto,
    @CurrentUser() user: User,
  ) {
    return this.organizationsService.create(createDto, user.id);
  }

  /**
   * Récupérer toutes les organisations
   */
  @Get()
  async findAll() {
    return this.organizationsService.findAll();
  }

  /**
   * Récupérer les organisations de l'utilisateur connecté
   */
  @Get('my')
  async findMyOrganizations(@CurrentUser() user: User) {
    return this.organizationsService.findByUser(user.id);
  }

  /**
   * Récupérer une organisation par son ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  /**
   * Récupérer une organisation par son slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  /**
   * Mettre à jour une organisation (OWNER ou ADMIN uniquement)
   */
  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ORGANIZATION)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateDto);
  }

  /**
   * Supprimer une organisation (OWNER uniquement)
   */
  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ORGANIZATION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(id);
  }

  /**
   * Ajouter un utilisateur à une organisation (ADMIN ou OWNER uniquement)
   */
  @Post(':id/users')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_USERS)
  @HttpCode(HttpStatus.CREATED)
  async addUser(
    @Param('id') organizationId: string,
    @Body() addUserDto: AddUserToOrganizationDto,
  ) {
    await this.organizationsService.addUserToOrganization(
      organizationId,
      {
        userId: addUserDto.userId,
        email: addUserDto.email,
      },
      {
        role: addUserDto.role ?? undefined,
        organizationRoleId: addUserDto.organizationRoleId,
      },
    );
  }

  /**
   * Récupérer les utilisateurs d'une organisation (ADMIN ou OWNER uniquement)
   */
  @Get(':id/users')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_USERS)
  async getUsers(@Param('id') organizationId: string) {
    return this.organizationsService.getOrganizationUsers(organizationId);
  }

  /**
   * Mettre à jour le rôle d'un utilisateur dans une organisation (OWNER uniquement)
   */
  @Patch(':id/users/:userId/role')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async updateUserRole(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    await this.organizationsService.updateUserRole(
      organizationId,
      userId,
      {
        role: updateRoleDto.role,
        organizationRoleId: updateRoleDto.organizationRoleId,
      },
    );
  }

  /**
   * Retirer un utilisateur d'une organisation (OWNER uniquement)
   */
  @Delete(':id/users/:userId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_USERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUser(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationsService.removeUserFromOrganization(
      organizationId,
      userId,
    );
  }

  /**
   * Récupérer les applications souscrites pour une organisation
   */
  @Get(':id/applications')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_APPS)
  async listApplications(@Param('id') organizationId: string) {
    const applications =
      await this.organizationsService.listOrganizationApplications(organizationId);

    return applications.map((application) => this.mapOrganizationApplication(application));
  }

  /**
   * Récupérer les applications disponibles pour une organisation
   */
  @Get(':id/applications/available')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_APPS)
  async listAvailableApplications(@Param('id') organizationId: string) {
    const applications =
      await this.organizationsService.listAvailableApplications(organizationId);

    return applications.map((application) => this.mapAvailableApplication(application));
  }

  /**
   * Souscrire à une application
   */
  @Post(':id/applications')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_APPS)
  @HttpCode(HttpStatus.CREATED)
  async subscribeToApplication(
    @Param('id') organizationId: string,
    @Body() dto: SubscribeApplicationDto,
  ) {
    const subscription = await this.organizationsService.subscribeToApplication(
      organizationId,
      {
        applicationId: dto.applicationId,
        startsAt: dto.startsAt ?? undefined,
        endsAt: dto.endsAt ?? undefined,
      },
    );

    return this.mapOrganizationApplication(subscription);
  }

  /**
   * Désinstaller une application
   */
  @Delete(':id/applications/:subscriptionId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_APPS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeFromApplication(
    @Param('id') organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    await this.organizationsService.unsubscribeFromApplication(
      organizationId,
      subscriptionId,
    );
  }

  /**
   * Récupérer les rôles disponibles pour une organisation (rôles système + personnalisés)
   */
  @Get(':id/roles')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async listRoles(@Param('id') organizationId: string) {
    const roles =
      await this.organizationRolesService.listOrganizationRoles(organizationId);

    return roles.map((role) => this.mapRole(role));
  }

  /**
   * Récupérer l'ensemble des permissions disponibles
   */
  @Get(':id/roles/available-permissions')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async listPermissions(@Param('id') organizationId: string) {
    const permissions =
      await this.organizationRolesService.listPermissions(organizationId);

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));
  }

  /**
   * Créer un rôle personnalisé pour une organisation (OWNER uniquement)
   */
  @Post(':id/roles')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async createRole(
    @Param('id') organizationId: string,
    @Body() dto: CreateOrganizationRoleDto,
  ) {
    const role = await this.organizationRolesService.createRole(
      organizationId,
      dto,
    );

    return this.mapRole(role);
  }

  /**
   * Mettre à jour un rôle personnalisé (OWNER uniquement)
   */
  @Patch(':id/roles/:roleId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async updateRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateOrganizationRoleDto,
  ) {
    const role = await this.organizationRolesService.updateRole(
      organizationId,
      roleId,
      dto,
    );

    return this.mapRole(role);
  }

  /**
   * Mettre à jour les permissions d'un rôle personnalisé (OWNER uniquement)
   */
  @Put(':id/roles/:roleId/permissions')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  async setRolePermissions(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    const role = await this.organizationRolesService.setRolePermissions(
      organizationId,
      roleId,
      dto,
    );

    return this.mapRole(role);
  }

  /**
   * Supprimer un rôle personnalisé (OWNER uniquement)
   */
  @Delete(':id/roles/:roleId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.organizationRolesService.deleteRole(organizationId, roleId);
  }

  private mapRole(role: TenantOrganizationRole) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: (role.permissions || [])
        .filter(
          (code): code is PermissionCode => Boolean(code),
        ),
    };
  }

  private mapOrganizationApplication(application: TenantOrganizationApplication) {
    return {
      subscriptionId: application.subscriptionId,
      organizationId: application.organizationId,
      applicationId: application.applicationId,
      name: application.name,
      slug: application.slug,
      description: application.description,
      category: application.category,
      applicationStatus: application.applicationStatus,
      subscriptionStatus: application.subscriptionStatus,
      subscribedAt:
        application.subscribedAt instanceof Date
          ? application.subscribedAt.toISOString()
          : application.subscribedAt,
      startsAt:
        application.startsAt instanceof Date
          ? application.startsAt.toISOString()
          : application.startsAt,
      endsAt:
        application.endsAt instanceof Date
          ? application.endsAt.toISOString()
          : application.endsAt,
      updatedAt:
        application.updatedAt instanceof Date
          ? application.updatedAt.toISOString()
          : application.updatedAt,
    };
  }

  private mapAvailableApplication(application: TenantApplication) {
    return {
      id: application.id,
      name: application.name,
      slug: application.slug,
      description: application.description,
      category: application.category,
      status: application.status,
      createdAt:
        application.createdAt instanceof Date
          ? application.createdAt.toISOString()
          : application.createdAt,
      updatedAt:
        application.updatedAt instanceof Date
          ? application.updatedAt.toISOString()
          : application.updatedAt,
    };
  }
}

