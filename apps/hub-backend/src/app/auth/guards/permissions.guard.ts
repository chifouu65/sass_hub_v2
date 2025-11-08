import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionCode } from '../../entities/permission.entity';
import { OrganizationsService } from '../../organizations/organizations.service';
import { OrganizationRolesService } from '../../organization-roles/organization-roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizationsService: OrganizationsService,
    private readonly organizationRolesService: OrganizationRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PermissionCode[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId =
      request.params.id ||
      request.params.organizationId ||
      request.body?.organizationId;

    if (!user || !organizationId) {
      throw new ForbiddenException(
        'Organization ID et utilisateur requis pour vérifier les permissions',
      );
    }

    const membership =
      await this.organizationsService.getUserOrganizationMembership(
        organizationId,
        user.id,
      );

    if (!membership) {
      throw new ForbiddenException(
        'Vous ne faites pas partie de cette organisation',
      );
    }

    const permissions =
      await this.organizationRolesService.getEffectivePermissionsForMembership(
        membership,
      );

    const hasAllPermissions = requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Accès refusé. Permissions requises: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

