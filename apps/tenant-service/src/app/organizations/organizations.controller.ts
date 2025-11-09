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
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';
import { CreateOrganizationRoleDto } from '../organization-roles/dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from '../organization-roles/dto/update-organization-role.dto';
import { SetRolePermissionsDto } from '../organization-roles/dto/set-role-permissions.dto';
import { OrganizationRole } from '../entities/organization-role.entity';
import { PermissionCode } from '../entities/permission.entity';

@Controller('organizations')
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
  async create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
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
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.organizationsService.findByUser(userId);
  }

  /**
   * Récupérer une organisation par son slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  /**
   * Récupérer une organisation par son ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  /**
   * Mettre à jour une organisation (OWNER ou ADMIN uniquement)
   */
  @Patch(':id')
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(id);
  }

  /**
   * Ajouter un utilisateur à une organisation (ADMIN ou OWNER uniquement)
   */
  @Post(':id/users')
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
  async getUsers(@Param('id') organizationId: string) {
    return this.organizationsService.getOrganizationUsers(organizationId);
  }

  /**
   * Récupérer l’adhésion d’un utilisateur dans l’organisation
   */
  @Get(':id/users/:userId')
  async getMembership(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
  ) {
    const membership =
      await this.organizationsService.getUserOrganizationMembership(
        organizationId,
        userId,
      );

    if (!membership) {
      throw new NotFoundException(
        `Membre ${userId} introuvable pour l’organisation ${organizationId}`,
      );
    }

    return membership;
  }

  /**
   * Mettre à jour le rôle d'un utilisateur dans une organisation (OWNER uniquement)
   */
  @Patch(':id/users/:userId/role')
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
   * Récupérer les rôles disponibles pour une organisation (rôles système + personnalisés)
   */
  @Get(':id/roles')
  async listRoles(@Param('id') organizationId: string) {
    const roles =
      await this.organizationRolesService.listOrganizationRoles(organizationId);

    return roles.map((role) => this.mapRole(role));
  }

  /**
   * Récupérer l'ensemble des permissions disponibles
   */
  @Get(':id/roles/available-permissions')
  async listPermissions() {
    const permissions = await this.organizationRolesService.listPermissions();

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    }));
  }

  /**
   * Créer un rôle personnalisé pour une organisation (OWNER uniquement)
   */
  @Post(':id/roles')
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
  async setRolePermissions(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    const role = await this.organizationRolesService.updateRole(
      organizationId,
      roleId,
      { permissions: dto.permissions },
    );

    return this.mapRole(role);
  }

  /**
   * Supprimer un rôle personnalisé (OWNER uniquement)
   */
  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.organizationRolesService.deleteRole(organizationId, roleId);
  }

  private mapRole(role: OrganizationRole) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      permissions: (role.permissions || [])
        .map((permission) => permission.permission?.code)
        .filter(
          (code): code is PermissionCode => Boolean(code),
        ),
    };
  }
}

