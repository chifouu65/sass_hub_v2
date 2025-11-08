import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserOrganizationRole } from './dto/add-user-to-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

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
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER, UserOrganizationRole.ADMIN)
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
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(id);
  }

  /**
   * Ajouter un utilisateur à une organisation (ADMIN ou OWNER uniquement)
   */
  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER, UserOrganizationRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addUser(
    @Param('id') organizationId: string,
    @Body() addUserDto: AddUserToOrganizationDto,
  ) {
    await this.organizationsService.addUserToOrganization(
      organizationId,
      addUserDto.userId,
      addUserDto.role || UserOrganizationRole.MEMBER,
    );
  }

  /**
   * Récupérer les utilisateurs d'une organisation (ADMIN ou OWNER uniquement)
   */
  @Get(':id/users')
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER, UserOrganizationRole.ADMIN)
  async getUsers(@Param('id') organizationId: string) {
    return this.organizationsService.getOrganizationUsers(organizationId);
  }

  /**
   * Mettre à jour le rôle d'un utilisateur dans une organisation (OWNER uniquement)
   */
  @Patch(':id/users/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER)
  async updateUserRole(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    await this.organizationsService.updateUserRole(
      organizationId,
      userId,
      updateRoleDto.role,
    );
  }

  /**
   * Retirer un utilisateur d'une organisation (OWNER uniquement)
   */
  @Delete(':id/users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserOrganizationRole.OWNER)
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
}

