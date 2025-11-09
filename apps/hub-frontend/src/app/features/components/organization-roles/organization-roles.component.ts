import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { OrganizationRoleView } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { SkeletonComponent } from '../skeleton/skeleton';
import { ModalService } from '../../services/modal/modal.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../confirm-modal/confirm-modal.component';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { OrganizationRoleCreateModalComponent } from './organization-role-create-modal.component';
import { OrganizationRolePermissionsModalComponent } from './organization-role-permissions-modal.component';
import { OrganizationRoleUpdateModalComponent } from './organization-role-update-modal.component';
import {
  GenericTableComponent,
  GenericTableHeader,
} from '../generic-table/generic-table.component';

const PERMISSION_METADATA: Record<
  string,
  { label: string; description: string }
> = {
  manage_apps: {
    label: 'Gérer les applications',
    description: 'Installer, configurer et retirer des applications',
  },
  manage_billing: {
    label: 'Gérer la facturation',
    description: 'Accéder à la facturation et gérer les abonnements',
  },
  manage_organization: {
    label: "Gérer l'organisation",
    description: "Modifier les paramètres globaux de l'organisation",
  },
  manage_roles: {
    label: 'Gérer les rôles',
    description: 'Créer et assigner des rôles personnalisés',
  },
  manage_users: {
    label: 'Gérer les utilisateurs',
    description: "Inviter, supprimer et gérer les membres de l'organisation",
  },
  view_only: {
    label: 'Lecture seule',
    description: 'Consulter les informations sans modification',
  },
  view_reports: {
    label: 'Consulter les rapports',
    description: 'Voir les rapports et les tableaux de bord analytiques',
  },
};

@Component({
  selector: 'app-organization-roles',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, GenericTableComponent],
  templateUrl: './organization-roles.component.html',
})
export class OrganizationRolesComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly roles = this.#organizationRolesStore.roles;
  readonly permissions = this.#organizationRolesStore.permissions;
  readonly error = this.#organizationRolesStore.error;
  readonly loading = this.#organizationRolesStore.loading;

  readonly deleteRoleInProgress = signal<string | null>(null);
  readonly tableHeaders: GenericTableHeader[] = [
    { key: 'role', label: 'Rôle', align: 'left' },
    { key: 'type', label: 'Type', align: 'left' },
    { key: 'permissions', label: 'Permissions', align: 'left' },
    { key: 'updatedAt', label: 'Dernière mise à jour', align: 'left' },
    { key: 'actions', label: 'Actions', align: 'right', srOnly: true },
  ];
  readonly tableSkeletonRows = 4;
  readonly roleSearchTerm = signal('');
  readonly filteredRoles = computed(() => {
    const term = this.roleSearchTerm().trim().toLowerCase();
    const list = this.roles();
    if (!term) {
      return list;
    }
    return list.filter((role) => {
      const haystack = [
        role.name,
        role.slug,
        role.description ?? '',
        role.permissions.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });

  readonly availablePermissions = computed(() =>
    this.permissions().map((permission) => {
      const metadata = PERMISSION_METADATA[permission.code] ?? null;
      return {
        code: permission.code,
        label: metadata?.label ?? permission.name ?? permission.code,
        description:
          metadata?.description ?? permission.description ?? '—',
      };
    })
  );

  onRefresh(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  onOrganizationSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.#organizationRolesStore.selectOrganization(value);
    }
  }

  onRoleSearchChange(term: string): void {
    this.roleSearchTerm.set(term);
  }

  async openCreateRoleModal(): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const organization =
      this.organizations().find((org) => org.id === organizationId) ?? null;
    const permissions = this.permissions();

    const modalRef = this.#modalService.open<
      OrganizationRoleCreateModalComponent,
      boolean
    >(OrganizationRoleCreateModalComponent, {
      data: {
        organizationId,
        organizationName: organization?.name ?? 'cette organisation',
        permissions,
      },
      host: {
        title: 'Créer un rôle',
        },
      });

    await firstValueFrom(modalRef.afterClosed());
  }

  async deleteRole(role: OrganizationRoleView): Promise<void> {
    if (role.isSystem) {
      return;
    }
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = await this.#confirmAction({
        description: `Le rôle "${role.name}" sera supprimé définitivement.`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
    });
    if (!confirmed) {
      return;
    }

    this.deleteRoleInProgress.set(role.id);
    this.#organizationRolesStore
      .deleteRole(organizationId, role.id)
      .pipe(finalize(() => this.deleteRoleInProgress.set(null)))
      .subscribe();
  }

  async #confirmAction(data: ConfirmModalData): Promise<boolean> {
    const modalRef = this.#modalService.open<ConfirmModalComponent, boolean>(
      ConfirmModalComponent,
      {
        data,
        host: {
          title: 'Supprimer un rôle',
        },
      }
    );

    const result = await firstValueFrom(modalRef.afterClosed());
    return result ?? false;
  }

  trackRole(_: number, role: OrganizationRoleView): string {
    return role.id;
  }

  getPermissionInfo(code: string): { label: string; description: string } {
    return (
      PERMISSION_METADATA[code] ?? {
        label: code,
        description: '—',
      }
    );
  }

  openRolePermissionsModal(role: OrganizationRoleView): void {
    if (!role.permissions.length) {
      return;
    }

    const details = role.permissions.map((code: string) => ({
      code,
      ...this.getPermissionInfo(code),
    }));

    this.#modalService.open<OrganizationRolePermissionsModalComponent, void>(
      OrganizationRolePermissionsModalComponent,
      {
        data: {
          roleName: role.name,
          permissions: details,
        },
        host: {
          title: `Permissions de ${role.name}`,
        },
      }
    );
  }

  openUpdateRoleModal(role: OrganizationRoleView): void {
    if (role.isSystem) {
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    this.#modalService.open<OrganizationRoleUpdateModalComponent, void>(
      OrganizationRoleUpdateModalComponent,
      {
        data: {
          organizationId,
          role,
          permissions: this.permissions(),
        },
        host: {
          title: `Modifier ${role.name}`,
        },
      }
    );
  }
}
