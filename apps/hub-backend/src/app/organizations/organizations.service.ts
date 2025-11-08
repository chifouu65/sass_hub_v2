import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationStatus } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { User } from '../entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly organizationRolesService: OrganizationRolesService,
  ) {}

  /**
   * Créer une nouvelle organisation
   */
  async create(
    createDto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<OrganizationResponseDto> {
    // Vérifier si le slug existe déjà
    const existingBySlug = await this.organizationRepository.findOne({
      where: { slug: createDto.slug },
    });

    if (existingBySlug) {
      throw new ConflictException(`Une organisation avec le slug "${createDto.slug}" existe déjà`);
    }

    // Générer un nom de base de données si non fourni
    const databaseName = createDto.databaseName || `tenant_${createDto.slug}`;

    // Créer l'organisation
    const organization = this.organizationRepository.create({
      name: createDto.name,
      slug: createDto.slug,
      databaseName,
      status: OrganizationStatus.ACTIVE,
    });

    const savedOrganization = await this.organizationRepository.save(organization);

    // Ajouter le créateur comme owner
    await this.addUserToOrganization(
      savedOrganization.id,
      { userId: ownerId },
      {
        role: UserOrganizationRole.OWNER,
      },
    );

    return this.mapToResponseDto(savedOrganization);
  }

  /**
   * Récupérer toutes les organisations
   */
  async findAll(): Promise<OrganizationResponseDto[]> {
    const organizations = await this.organizationRepository.find({
      order: { createdAt: 'DESC' },
    });
    return organizations.map((org) => this.mapToResponseDto(org));
  }

  /**
   * Récupérer une organisation par son ID
   */
  async findOne(id: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec l'ID "${id}" introuvable`);
    }

    return this.mapToResponseDto(organization);
  }

  /**
   * Récupérer une organisation par son slug
   */
  async findBySlug(slug: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec le slug "${slug}" introuvable`);
    }

    return this.mapToResponseDto(organization);
  }

  /**
   * Récupérer les organisations d'un utilisateur
   */
  async findByUser(userId: string): Promise<OrganizationResponseDto[]> {
    const userOrganizations = await this.userOrganizationRepository.find({
      where: { userId },
      relations: ['organization'],
    });

    return userOrganizations.map((uo) => this.mapToResponseDto(uo.organization));
  }

  /**
   * Mettre à jour une organisation
   */
  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec l'ID "${id}" introuvable`);
    }

    // Vérifier si le nouveau slug est déjà utilisé
    if (updateDto.slug && updateDto.slug !== organization.slug) {
      const existingBySlug = await this.organizationRepository.findOne({
        where: { slug: updateDto.slug },
      });

      if (existingBySlug) {
        throw new ConflictException(`Une organisation avec le slug "${updateDto.slug}" existe déjà`);
      }
    }

    // Appliquer les modifications
    Object.assign(organization, updateDto);
    const updatedOrganization = await this.organizationRepository.save(organization);

    return this.mapToResponseDto(updatedOrganization);
  }

  /**
   * Supprimer une organisation
   */
  async remove(id: string): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec l'ID "${id}" introuvable`);
    }

    await this.organizationRepository.remove(organization);
  }

  /**
   * Ajouter un utilisateur à une organisation
   */
  async addUserToOrganization(
    organizationId: string,
    identifier: { userId?: string; email?: string },
    options: {
      role?: UserOrganizationRole;
      organizationRoleId?: string;
    } = {},
  ): Promise<void> {
    // Vérifier que l'organisation existe
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec l'ID "${organizationId}" introuvable`);
    }

    // Vérifier que l'utilisateur existe (par id ou email)
    const user = await this.resolveUserIdentifier(identifier);

    // Vérifier si l'association existe déjà
    const existing = await this.userOrganizationRepository.findOne({
      where: { userId: user.id, organizationId },
    });

    if (existing) {
      throw new ConflictException(
        `L'utilisateur est déjà membre de cette organisation`,
      );
    }

    const selection = {
      role: options.role,
      organizationRoleId: options.organizationRoleId,
    };

    if (!selection.role && !selection.organizationRoleId) {
      selection.role = UserOrganizationRole.MEMBER;
    }

    const { resolvedRole, resolvedOrganizationRoleId } =
      await this.resolveRoleSelection(organizationId, selection);

    // Créer l'association
    const userOrganization = this.userOrganizationRepository.create({
      userId: user.id,
      organizationId,
      role: resolvedRole,
      organizationRoleId: resolvedOrganizationRoleId,
    });

    await this.userOrganizationRepository.save(userOrganization);
  }

  /**
   * Mettre à jour le rôle d'un utilisateur dans une organisation
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    update: {
      role?: UserOrganizationRole;
      organizationRoleId?: string;
    },
  ): Promise<void> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (!userOrganization) {
      throw new NotFoundException(
        `L'utilisateur n'est pas membre de cette organisation`,
      );
    }

    if (!update.role && !update.organizationRoleId) {
      throw new BadRequestException(
        'Vous devez fournir un rôle ou un rôle personnalisé',
      );
    }

    const { resolvedRole, resolvedOrganizationRoleId } =
      await this.resolveRoleSelection(organizationId, update);

    userOrganization.role = resolvedRole;
    userOrganization.organizationRoleId = resolvedOrganizationRoleId;

    await this.userOrganizationRepository.save(userOrganization);
  }

  /**
   * Retirer un utilisateur d'une organisation
   */
  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (!userOrganization) {
      throw new NotFoundException(
        `L'utilisateur n'est pas membre de cette organisation`,
      );
    }

    // Vérifier qu'on ne retire pas le dernier owner
    if (userOrganization.role === UserOrganizationRole.OWNER) {
      const ownersCount = await this.userOrganizationRepository.count({
        where: {
          organizationId,
          role: UserOrganizationRole.OWNER,
        },
      });

      if (ownersCount === 1) {
        throw new BadRequestException(
          'Impossible de retirer le dernier propriétaire de l\'organisation',
        );
      }
    }

    await this.userOrganizationRepository.remove(userOrganization);
  }

  /**
   * Récupérer les utilisateurs d'une organisation
   */
  async getOrganizationUsers(organizationId: string) {
    const userOrganizations = await this.userOrganizationRepository.find({
      where: { organizationId },
      relations: ['user', 'organizationRole'],
    });

    return userOrganizations.map((uo) => ({
      id: uo.id,
      userId: uo.user.id,
      email: uo.user.email,
      firstName: uo.user.firstName,
      lastName: uo.user.lastName,
      role: uo.role,
      organizationRoleId: uo.organizationRoleId,
      organizationRoleSlug: uo.organizationRole?.slug ?? null,
      organizationRoleName: uo.organizationRole?.name ?? null,
      createdAt: uo.createdAt,
    }));
  }

  /**
   * Vérifier si un utilisateur est membre d'une organisation
   */
  async isUserMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    return !!userOrganization;
  }

  /**
   * Vérifier si un utilisateur a un rôle spécifique dans une organisation
   */
  async hasUserRole(
    userId: string,
    organizationId: string,
    role: UserOrganizationRole,
  ): Promise<boolean> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId, role },
    });

    return !!userOrganization;
  }

  /**
   * Récupérer le rôle d'un utilisateur dans une organisation
   */
  async getUserRole(
    organizationId: string,
    userId: string,
  ): Promise<string | null> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
      relations: ['organizationRole'],
    });

    if (!userOrganization) {
      return null;
    }

    if (userOrganization.role) {
      return userOrganization.role;
    }

    return userOrganization.organizationRole?.slug ?? null;
  }

  async getUserOrganizationMembership(
    organizationId: string,
    userId: string,
  ): Promise<UserOrganization | null> {
    return this.userOrganizationRepository.findOne({
      where: { organizationId, userId },
      relations: [
        'organizationRole',
        'organizationRole.permissions',
        'organizationRole.permissions.permission',
      ],
    });
  }

  private async resolveRoleSelection(
    organizationId: string,
    selection: {
      role?: UserOrganizationRole;
      organizationRoleId?: string;
    },
  ): Promise<{
    resolvedRole: UserOrganizationRole | null;
    resolvedOrganizationRoleId: string | null;
  }> {
    if (selection.role && selection.organizationRoleId) {
      throw new BadRequestException(
        'Vous ne pouvez pas fournir un rôle et un rôle personnalisé simultanément',
      );
    }

    if (selection.organizationRoleId) {
      const roleEntity =
        await this.organizationRolesService.getRoleWithPermissions(
          selection.organizationRoleId,
        );

      if (
        !roleEntity.isSystem &&
        roleEntity.organizationId !== organizationId
      ) {
        throw new BadRequestException(
          'Le rôle personnalisé ne correspond pas à cette organisation',
        );
      }

      if (roleEntity.isSystem) {
        return {
          resolvedRole: roleEntity.slug as UserOrganizationRole,
          resolvedOrganizationRoleId: null,
        };
      }

      return {
        resolvedRole: null,
        resolvedOrganizationRoleId: roleEntity.id,
      };
    }

    return {
      resolvedRole: selection.role ?? UserOrganizationRole.MEMBER,
      resolvedOrganizationRoleId: null,
    };
  }

  private async resolveUserIdentifier(identifier: {
    userId?: string;
    email?: string;
  }): Promise<User> {
    if (!identifier.userId && !identifier.email) {
      throw new BadRequestException(
        'Vous devez fournir un identifiant utilisateur ou un email',
      );
    }

    let user: User | null = null;

    if (identifier.userId) {
      user = await this.userRepository.findOne({
        where: { id: identifier.userId },
      });
    } else if (identifier.email) {
      const normalizedEmail = identifier.email.trim().toLowerCase();
      user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
    }

    if (!user) {
      throw new NotFoundException(
        identifier.userId
          ? `Utilisateur avec l'ID "${identifier.userId}" introuvable`
          : `Utilisateur avec l'email "${identifier.email?.trim().toLowerCase()}" introuvable`,
      );
    }

    return user;
  }

  /**
   * Mapper une entité Organization vers un DTO de réponse
   */
  private mapToResponseDto(organization: Organization): OrganizationResponseDto {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      databaseName: organization.databaseName,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}

