import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { User } from '../entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddUserToOrganizationDto } from './dto/add-user-to-organization.dto';
import { UserOrganizationRole } from './constants/user-organization-role.enum';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { ISODateString } from '@sass-hub-v2/shared-types';
import { normalizeEmail } from '@sass-hub-v2/utils';
import { OrganizationStatus } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../organization-roles/organization-roles.service';
import { PermissionCode } from '../entities/permission.entity';
import { TenantDatabaseService } from '@sass-hub-v2/tenant-db';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Application, ApplicationStatus } from '../entities/application.entity';

export interface OrganizationMembershipResponse {
  id: string;
  organizationId: string;
  userId: string;
  role: UserOrganizationRole | null;
  organizationRoleId: string | null;
  organizationRoleSlug: string | null;
  organizationRoleName: string | null;
  permissions: PermissionCode[];
  createdAt: ISODateString;
}

export interface OrganizationApplicationResponse {
  subscriptionId: string;
  organizationId: string;
  applicationId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  applicationStatus: ApplicationStatus;
  subscriptionStatus: SubscriptionStatus;
  subscribedAt: ISODateString;
  startsAt: ISODateString | null;
  endsAt: ISODateString | null;
  updatedAt: ISODateString;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private readonly organizationRolesService: OrganizationRolesService,
    private readonly tenantDatabaseService: TenantDatabaseService,
  ) {}

  private defaultApplicationsSeeded = false;

  private readonly defaultApplicationsSeedData: Array<{
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    status: ApplicationStatus;
  }> = [
    {
      name: 'CRM Pro',
      slug: 'crm-pro',
      description: 'Centralisez vos prospects et automatisez le suivi commercial.',
      category: 'CRM',
      status: ApplicationStatus.ACTIVE,
    },
    {
      name: 'Support Desk',
      slug: 'support-desk',
      description: 'Gestion des tickets et base de connaissances pour vos équipes support.',
      category: 'Support',
      status: ApplicationStatus.ACTIVE,
    },
    {
      name: 'Insights Analytics',
      slug: 'insights-analytics',
      description: 'Tableaux de bord analytiques pour suivre la performance de vos équipes.',
      category: 'Analytics',
      status: ApplicationStatus.BETA,
    },
  ];

  /**
   * Créer une nouvelle organisation
   */
  async create(createDto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    const ownerId = createDto.ownerId;
    // Vérifier si le slug existe déjà
    const existingBySlug = await this.organizationRepository.findOne({
      where: { slug: createDto.slug },
    });

    if (existingBySlug) {
      throw new ConflictException(`Une organisation avec le slug "${createDto.slug}" existe déjà`);
    }

    // Générer un nom de base de données si non fourni
    const databaseName = createDto.databaseName || `tenant_${createDto.slug}`;

    try {
      await this.tenantDatabaseService.ensureTenantDatabase(databaseName);
      await this.tenantDatabaseService.getTenantDataSource(databaseName);
    } catch (error) {
      this.handleTenantDatabaseProvisioningError(error, databaseName);
    }

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

    const originalDatabaseName = organization.databaseName;

    // Appliquer les modifications
    Object.assign(organization, updateDto);
    const updatedOrganization = await this.organizationRepository.save(organization);

    if (
      updateDto.databaseName &&
      updateDto.databaseName !== originalDatabaseName
    ) {
      await this.tenantDatabaseService.disposeTenantDataSource(
        originalDatabaseName
      );
      await this.tenantDatabaseService.ensureTenantDatabase(updatedOrganization.databaseName);
      await this.tenantDatabaseService.getTenantDataSource(updatedOrganization.databaseName);
    }

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
  async getOrganizationUsers(
    organizationId: string,
  ): Promise<
    Array<
      OrganizationMembershipResponse & {
        email: string;
        firstName: string | null;
        lastName: string | null;
      }
    >
  > {
    const userOrganizations = await this.userOrganizationRepository.find({
      where: { organizationId },
      relations: [
        'user',
        'organizationRole',
        'organizationRole.permissions',
        'organizationRole.permissions.permission',
      ],
    });

    return Promise.all(
      userOrganizations.map(async (uo) => {
        const membership = await this.mapMembership(uo);
        if (!membership) {
          throw new NotFoundException(
            `Membre "${uo.id}" introuvable pour l’organisation ${organizationId}`,
          );
        }

        return {
          ...membership,
          email: uo.user.email,
          firstName: uo.user.firstName,
          lastName: uo.user.lastName,
        };
      }),
    );
  }

  /**
   * Récupérer les applications souscrites par une organisation
   */
  async listOrganizationApplications(
    organizationId: string,
  ): Promise<OrganizationApplicationResponse[]> {
    await this.ensureOrganizationExists(organizationId);

    const subscriptions = await this.subscriptionRepository.find({
      where: { organizationId },
      relations: ['application'],
      order: { createdAt: 'DESC' },
    });

    return subscriptions.map((subscription) =>
      this.mapSubscriptionToResponse(subscription),
    );
  }

  /**
   * Récupérer les applications disponibles non souscrites
   */
  async listAvailableApplications(organizationId: string): Promise<Application[]> {
    await this.ensureOrganizationExists(organizationId);
    await this.ensureDefaultApplications();

    const subscriptions = await this.subscriptionRepository.find({
      select: ['applicationId'],
      where: { organizationId },
    });
    const excludedIds = new Set(subscriptions.map((sub) => sub.applicationId));

    const applications = await this.applicationRepository.find({
      order: { name: 'ASC' },
    });

    return applications.filter((app) => !excludedIds.has(app.id));
  }

  /**
   * Souscrire une organisation à une application
   */
  async subscribeToApplication(
    organizationId: string,
    applicationId: string,
    options: { startsAt?: ISODateString | null; endsAt?: ISODateString | null } = {},
  ): Promise<OrganizationApplicationResponse> {
    await this.ensureOrganizationExists(organizationId);
    await this.ensureDefaultApplications();

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(
        `Application avec l'ID "${applicationId}" introuvable`,
      );
    }

    const existing = await this.subscriptionRepository.findOne({
      where: { organizationId, applicationId },
    });

    if (existing) {
      throw new ConflictException(
        `L'organisation est déjà souscrite à cette application`,
      );
    }

    const subscription = this.subscriptionRepository.create({
      organizationId,
      applicationId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: options.startsAt ? new Date(options.startsAt) : null,
      endsAt: options.endsAt ? new Date(options.endsAt) : null,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    saved.application = application;

    return this.mapSubscriptionToResponse(saved);
  }

  /**
   * Désinstaller une application pour une organisation
   */
  async unsubscribeFromApplication(
    organizationId: string,
    subscriptionId: string,
  ): Promise<void> {
    await this.ensureOrganizationExists(organizationId);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, organizationId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Souscription "${subscriptionId}" introuvable pour l’organisation ${organizationId}`,
      );
    }

    await this.subscriptionRepository.remove(subscription);
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
    const membership = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
      relations: ['organizationRole'],
    });

    if (!membership) {
      return null;
    }

    if (membership.role) {
      return membership.role;
    }

    return membership.organizationRole?.slug ?? null;
  }

  private async mapMembership(
    membership: UserOrganization | null,
  ): Promise<OrganizationMembershipResponse | null> {
    if (!membership) {
      return null;
    }

    const permissions =
      await this.organizationRolesService.getEffectivePermissionsForMembership(
        membership,
      );

    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role ?? null,
      organizationRoleId: membership.organizationRoleId ?? null,
      organizationRoleSlug: membership.organizationRole?.slug ?? null,
      organizationRoleName: membership.organizationRole?.name ?? null,
      permissions,
      createdAt: membership.createdAt.toISOString(),
    };
  }

  async getUserOrganizationMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembershipResponse | null> {
    const membership = await this.userOrganizationRepository.findOne({
      where: { organizationId, userId },
      relations: [
        'organizationRole',
        'organizationRole.permissions',
        'organizationRole.permissions.permission',
      ],
    });

    return this.mapMembership(membership);
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const exists = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: ['id'],
    });

    if (!exists) {
      throw new NotFoundException(
        `Organisation avec l'ID "${organizationId}" introuvable`,
      );
    }
  }

  private mapSubscriptionToResponse(
    subscription: Subscription & { application?: Application },
  ): OrganizationApplicationResponse {
    const application = subscription.application;

    return {
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      applicationId: subscription.applicationId,
      name: application?.name ?? 'Application inconnue',
      slug: application?.slug ?? 'unknown',
      description: application?.description ?? null,
      category: application?.category ?? null,
      applicationStatus: application?.status ?? ApplicationStatus.ACTIVE,
      subscriptionStatus: subscription.status,
      subscribedAt: subscription.createdAt.toISOString(),
      startsAt: subscription.startsAt ? subscription.startsAt.toISOString() : null,
      endsAt: subscription.endsAt ? subscription.endsAt.toISOString() : null,
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  private async ensureDefaultApplications(): Promise<void> {
    if (this.defaultApplicationsSeeded) {
      return;
    }

    const count = await this.applicationRepository.count();
    if (count === 0) {
      const entities = this.defaultApplicationsSeedData.map((data) =>
        this.applicationRepository.create(data),
      );
      await this.applicationRepository.save(entities);
    }

    this.defaultApplicationsSeeded = true;
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
      const normalizedEmail = normalizeEmail(identifier.email);
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
      status: organization.status as OrganizationStatus,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  private handleTenantDatabaseProvisioningError(
    error: unknown,
    databaseName: string,
  ): never {
    if (error && typeof error === 'object') {
      const maybeCode = (error as { code?: string }).code;
      if (maybeCode === 'ER_DBACCESS_DENIED_ERROR') {
        throw new ForbiddenException(
          `Impossible de créer la base de données "${databaseName}". Le compte MySQL configuré n'a pas les privilèges nécessaires (CREATE DATABASE).`,
        );
      }
    }

    throw new ServiceUnavailableException(
      `La base de données "${databaseName}" n'a pas pu être provisionnée. Réessayez plus tard ou contactez un administrateur.`,
    );
  }
}

