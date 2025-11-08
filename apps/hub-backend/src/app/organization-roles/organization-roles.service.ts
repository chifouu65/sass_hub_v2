import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationRole } from '../entities/organization-role.entity';
import { OrganizationRolePermission } from '../entities/organization-role-permission.entity';
import { Permission, PermissionCode } from '../entities/permission.entity';
import { CreateOrganizationRoleDto } from './dto/create-organization-role.dto';
import { UpdateOrganizationRoleDto } from './dto/update-organization-role.dto';
import {
  BUILT_IN_ORGANIZATION_ROLES,
  UserOrganizationRole,
} from '../organizations/constants/user-organization-role.enum';
import { UserOrganization } from '../entities/user-organization.entity';

const PERMISSION_DEFINITIONS: Record<
  PermissionCode,
  { name: string; description: string }
> = {
  [PermissionCode.MANAGE_ORGANIZATION]: {
    name: 'Gérer l’organisation',
    description: 'Modifier les paramètres globaux de l’organisation',
  },
  [PermissionCode.MANAGE_USERS]: {
    name: 'Gérer les utilisateurs',
    description: 'Inviter, supprimer et gérer les membres de l’organisation',
  },
  [PermissionCode.MANAGE_ROLES]: {
    name: 'Gérer les rôles',
    description: 'Créer et assigner des rôles personnalisés',
  },
  [PermissionCode.MANAGE_APPS]: {
    name: 'Gérer les applications',
    description: 'Installer, configurer et retirer des applications',
  },
  [PermissionCode.MANAGE_BILLING]: {
    name: 'Gérer la facturation',
    description: 'Accéder à la facturation et gérer les abonnements',
  },
  [PermissionCode.VIEW_REPORTS]: {
    name: 'Consulter les rapports',
    description: 'Voir les rapports et les tableaux de bord analytiques',
  },
  [PermissionCode.VIEW_ONLY]: {
    name: 'Lecture seule',
    description: 'Consulter les informations sans modification',
  },
};

const BUILT_IN_ROLE_PERMISSIONS: Record<UserOrganizationRole, PermissionCode[]> =
  {
    [UserOrganizationRole.OWNER]: [
      PermissionCode.MANAGE_ORGANIZATION,
      PermissionCode.MANAGE_USERS,
      PermissionCode.MANAGE_ROLES,
      PermissionCode.MANAGE_APPS,
      PermissionCode.MANAGE_BILLING,
      PermissionCode.VIEW_REPORTS,
      PermissionCode.VIEW_ONLY,
    ],
    [UserOrganizationRole.ADMIN]: [
      PermissionCode.MANAGE_ORGANIZATION,
      PermissionCode.MANAGE_USERS,
      PermissionCode.MANAGE_ROLES,
      PermissionCode.MANAGE_APPS,
      PermissionCode.VIEW_REPORTS,
      PermissionCode.VIEW_ONLY,
    ],
    [UserOrganizationRole.MEMBER]: [
      PermissionCode.MANAGE_APPS,
      PermissionCode.VIEW_REPORTS,
      PermissionCode.VIEW_ONLY,
    ],
    [UserOrganizationRole.VIEWER]: [PermissionCode.VIEW_ONLY],
  };

@Injectable()
export class OrganizationRolesService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationRolesService.name);

  constructor(
    @InjectRepository(OrganizationRole)
    private readonly roleRepository: Repository<OrganizationRole>,
    @InjectRepository(OrganizationRolePermission)
    private readonly rolePermissionRepository: Repository<OrganizationRolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensurePermissions();
    await this.ensureBuiltInRoles();
  }

  /**
   * Ensure that all permissions exist in the database.
   */
  private async ensurePermissions(): Promise<void> {
    const existing = await this.permissionRepository.find({
      where: {
        code: In(Object.keys(PERMISSION_DEFINITIONS) as PermissionCode[]),
      },
    });

    const existingCodes = new Set(existing.map((permission) => permission.code));
    const missing = (Object.keys(PERMISSION_DEFINITIONS) as PermissionCode[]).filter(
      (code) => !existingCodes.has(code),
    );

    if (!missing.length) {
      return;
    }

    const toInsert = missing.map((code) =>
      this.permissionRepository.create({
        code,
        name: PERMISSION_DEFINITIONS[code].name,
        description: PERMISSION_DEFINITIONS[code].description,
      }),
    );

    await this.permissionRepository.save(toInsert);
    this.logger.log(
      `Seeded ${toInsert.length} permission(s): ${missing.join(', ')}`,
    );
  }

  /**
   * Ensure built-in system roles exist with the expected permissions.
   */
  private async ensureBuiltInRoles(): Promise<void> {
    for (const role of BUILT_IN_ORGANIZATION_ROLES) {
      const existing = await this.roleRepository.findOne({
        where: {
          slug: role,
          organizationId: null,
        },
        relations: ['permissions', 'permissions.permission'],
      });

      if (!existing) {
        const created = this.roleRepository.create({
          name: role.charAt(0).toUpperCase() + role.slice(1),
          slug: role,
          description: `Rôle système ${role}`,
          organizationId: null,
          isSystem: true,
          isDefault: role === UserOrganizationRole.MEMBER,
        });

        const saved = await this.roleRepository.save(created);
        await this.setRolePermissions(saved.id, BUILT_IN_ROLE_PERMISSIONS[role]);
        this.logger.log(`Created built-in role "${role}"`);
        continue;
      }

      const expectedPermissions = BUILT_IN_ROLE_PERMISSIONS[role];
      const currentPermissions = new Set(
        (existing.permissions || []).map(
          (permission) => permission.permission.code,
        ),
      );

      const hasSamePermissions =
        expectedPermissions.length === currentPermissions.size &&
        expectedPermissions.every((code) => currentPermissions.has(code));

      if (!hasSamePermissions) {
        await this.setRolePermissions(existing.id, expectedPermissions);
        this.logger.log(`Updated permissions for built-in role "${role}"`);
      }
    }
  }

  async createRole(
    organizationId: string,
    dto: CreateOrganizationRoleDto,
  ): Promise<OrganizationRole> {
    await this.assertSlugIsUnique(organizationId, dto.slug);

    let basePermissions: PermissionCode[] | undefined;

    if (dto.baseRoleId) {
      const baseRole = await this.roleRepository.findOne({
        where: { id: dto.baseRoleId, organizationId },
        relations: ['permissions', 'permissions.permission'],
      });

      if (!baseRole) {
        throw new NotFoundException(
          `Rôle de base avec l'ID "${dto.baseRoleId}" introuvable`,
        );
      }

      basePermissions = baseRole.permissions.map(
        (permission) => permission.permission.code,
      );
    }

    const role = this.roleRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      organizationId,
      isSystem: false,
      isDefault: dto.isDefault ?? false,
    });

    const savedRole = await this.roleRepository.save(role);

    const permissionsToAssign = dto.permissions?.length
      ? dto.permissions
      : basePermissions;

    if (permissionsToAssign?.length) {
      await this.setRolePermissions(savedRole.id, permissionsToAssign);
    }

    return this.getRoleWithPermissions(savedRole.id);
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateOrganizationRoleDto,
  ): Promise<OrganizationRole> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, organizationId },
    });

    if (!role) {
      throw new NotFoundException(
        `Rôle personnalisé avec l'ID "${roleId}" introuvable`,
      );
    }

    if (dto.slug && dto.slug !== role.slug) {
      await this.assertSlugIsUnique(organizationId, dto.slug);
    }

    if (role.isSystem) {
      throw new BadRequestException('Impossible de modifier un rôle système');
    }

    Object.assign(role, {
      name: dto.name ?? role.name,
      slug: dto.slug ?? role.slug,
      description:
        dto.description !== undefined ? dto.description : role.description,
      isDefault: dto.isDefault ?? role.isDefault,
    });

    await this.roleRepository.save(role);

    if (dto.permissions) {
      await this.setRolePermissions(role.id, dto.permissions);
    }

    return this.getRoleWithPermissions(role.id);
  }

  async deleteRole(organizationId: string, roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, organizationId },
      relations: ['userOrganizations'],
    });

    if (!role) {
      throw new NotFoundException(
        `Rôle personnalisé avec l'ID "${roleId}" introuvable`,
      );
    }

    if (role.isSystem) {
      throw new BadRequestException('Impossible de supprimer un rôle système');
    }

    if (role.userOrganizations?.length) {
      throw new BadRequestException(
        'Impossible de supprimer un rôle assigné à des utilisateurs',
      );
    }

    await this.roleRepository.remove(role);
  }

  async assertSlugIsUnique(
    organizationId: string,
    slug: string,
  ): Promise<void> {
    const existing = await this.roleRepository.findOne({
      where: [
        { slug, organizationId },
        { slug, organizationId: null },
      ],
    });

    if (existing) {
      throw new ConflictException(
        `Le slug "${slug}" est déjà utilisé pour un rôle`,
      );
    }
  }

  async setRolePermissions(
    roleId: string,
    permissionCodes: PermissionCode[],
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID "${roleId}" introuvable`);
    }

    const permissions = await this.permissionRepository.find({
      where: { code: In(permissionCodes) },
    });

    if (permissions.length !== permissionCodes.length) {
      const missing = permissionCodes.filter(
        (code) => !permissions.find((permission) => permission.code === code),
      );
      throw new BadRequestException(
        `Permissions inexistantes: ${missing.join(', ')}`,
      );
    }

    await this.rolePermissionRepository.delete({ roleId });

    const rolePermissions = permissions.map((permission) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId: permission.id,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);
  }

  async listOrganizationRoles(organizationId: string): Promise<OrganizationRole[]> {
    return this.roleRepository.find({
      where: [
        { organizationId },
        { organizationId: null, isSystem: true },
      ],
      relations: ['permissions', 'permissions.permission'],
      order: {
        isSystem: 'DESC',
        name: 'ASC',
      },
    });
  }

  async getRoleWithPermissions(roleId: string): Promise<OrganizationRole> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID "${roleId}" introuvable`);
    }

    return role;
  }

  async findSystemRoleByKey(
    roleKey: UserOrganizationRole,
  ): Promise<OrganizationRole | null> {
    return this.roleRepository.findOne({
      where: { slug: roleKey, isSystem: true, organizationId: null },
      relations: ['permissions', 'permissions.permission'],
    });
  }

  getBuiltInPermissions(roleKey: UserOrganizationRole): PermissionCode[] {
    return BUILT_IN_ROLE_PERMISSIONS[roleKey] ?? [];
  }

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { code: 'ASC' },
    });
  }

  async getEffectivePermissionsForMembership(
    membership: UserOrganization,
  ): Promise<PermissionCode[]> {
    if (membership.role) {
      const roleKey = membership.role as UserOrganizationRole;
      return this.getBuiltInPermissions(roleKey);
    }

    if (!membership.organizationRoleId) {
      return [];
    }

    const role = membership.organizationRole
      ? membership.organizationRole
      : await this.getRoleWithPermissions(membership.organizationRoleId);

    return (role.permissions || []).map(
      (permission) => permission.permission.code,
    );
  }
}

