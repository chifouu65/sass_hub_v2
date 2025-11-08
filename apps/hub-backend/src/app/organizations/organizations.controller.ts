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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';
import { CreateOrganizationRoleDto } from '../organization-roles/dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from '../organization-roles/dto/update-organization-role.dto';
import { SetRolePermissionsDto } from '../organization-roles/dto/set-role-permissions.dto';
import { OrganizationRole } from '../entities/organization-role.entity';
import { PermissionCode } from '../entities/permission.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

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
  async listPermissions() {
    const permissions = await this.organizationRolesService.listPermissions();

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
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_ROLES)
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
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: (role.permissions || [])
        .map((permission) => permission.permission?.code)
        .filter(
          (code): code is PermissionCode => Boolean(code),
        ),
    };
  }
}

