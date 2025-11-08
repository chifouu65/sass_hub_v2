import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserOrganizationRole } from '../../organizations/constants/user-organization-role.enum';
import { OrganizationsService } from '../../organizations/organizations.service';

/**
 * Guard pour vérifier que l'utilisateur a le bon rôle dans l'organisation
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserOrganizationRole.ADMIN, UserOrganizationRole.OWNER)
 * @Get(':id/users')
 * async getUsers(@Param('id') organizationId: string) { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserOrganizationRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si pas de rôles requis, autoriser l'accès
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.id || request.params.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required for role check');
    }

    // Vérifier le rôle de l'utilisateur dans l'organisation
    const userRole = await this.organizationsService.getUserRole(
      organizationId,
      user.id,
    );

    if (!userRole) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasRole = requiredRoles.includes(userRole as UserOrganizationRole);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}

