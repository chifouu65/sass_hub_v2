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
import { AddUserToOrganizationDto, UserOrganizationRole } from './dto/add-user-to-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    await this.addUserToOrganization(savedOrganization.id, ownerId, UserOrganizationRole.OWNER);

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
    userId: string,
    role: UserOrganizationRole = UserOrganizationRole.MEMBER,
  ): Promise<void> {
    // Vérifier que l'organisation existe
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation avec l'ID "${organizationId}" introuvable`);
    }

    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID "${userId}" introuvable`);
    }

    // Vérifier si l'association existe déjà
    const existing = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (existing) {
      throw new ConflictException(
        `L'utilisateur est déjà membre de cette organisation`,
      );
    }

    // Créer l'association
    const userOrganization = this.userOrganizationRepository.create({
      userId,
      organizationId,
      role,
    });

    await this.userOrganizationRepository.save(userOrganization);
  }

  /**
   * Mettre à jour le rôle d'un utilisateur dans une organisation
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    role: UserOrganizationRole,
  ): Promise<void> {
    const userOrganization = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (!userOrganization) {
      throw new NotFoundException(
        `L'utilisateur n'est pas membre de cette organisation`,
      );
    }

    userOrganization.role = role;
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
      relations: ['user'],
    });

    return userOrganizations.map((uo) => ({
      id: uo.id,
      userId: uo.user.id,
      email: uo.user.email,
      firstName: uo.user.firstName,
      lastName: uo.user.lastName,
      role: uo.role,
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
    });

    return userOrganization?.role || null;
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

