import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  GenericTableComponent,
  GenericTableHeader,
} from '../generic-table/generic-table.component';
import { SkeletonComponent } from '../skeleton/skeleton';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ModalService, SearchTableToolbarComponent, SectionShellComponent } from '@sass-hub-v2/ui-kit';
import {
  OrganizationManageModalComponent,
  OrganizationManageModalData,
} from '../organization-manage-modal/organization-manage-modal.component';
import {
  OrganizationDeleteModalComponent,
  OrganizationDeleteModalData,
} from '../organization-delete-modal/organization-delete-modal.component';

@Component({
  selector: 'app-organization-table',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    SkeletonComponent,
    SearchTableToolbarComponent,
    SectionShellComponent,
  ],
  templateUrl: './organization-table.component.html',
})
export class OrganizationTableComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly loading = this.#organizationRolesStore.loading;

  readonly tableHeaders: GenericTableHeader[] = [
    { key: 'name', label: 'Organisation', align: 'left' },
    { key: 'slug', label: 'Slug', align: 'left' },
    { key: 'db', label: 'Base de données', align: 'left' },
    { key: 'updatedAt', label: 'Dernière mise à jour', align: 'left' },
    { key: 'actions', label: 'Actions', align: 'right', srOnly: true },
  ];
  readonly tableSkeletonRows = 4;

  readonly searchTerm = signal('');
  readonly filteredOrganizations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.organizations();
    if (!term) {
      return list;
    }

    return list.filter((organization) => {
      const haystack = [
        organization.name,
        organization.slug,
        organization.databaseName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onSelectOrganization(id: string): void {
    this.#organizationRolesStore.selectOrganization(id);
  }

  trackOrganization(_: number, organization: OrganizationSummary): string {
    return organization.id;
  }

  findOrganizationName(id: string): string {
    return (
      this.organizations().find((organization) => organization.id === id)?.name ??
      '—'
    );
  }

  openCreateModal(): void {
    this.#modalService.open<OrganizationManageModalComponent, boolean>(
      OrganizationManageModalComponent,
      {
        data: { mode: 'create' } satisfies OrganizationManageModalData,
        host: {
          title: 'Créer une organisation',
        },
      }
    );
  }

  openUpdateModal(organization: OrganizationSummary): void {
    this.#modalService.open<OrganizationManageModalComponent, boolean>(
      OrganizationManageModalComponent,
      {
        data: { mode: 'update', organization } satisfies OrganizationManageModalData,
        host: {
          title: `Modifier ${organization.name}`,
        },
      }
    );
  }

  openDeleteModal(organization: OrganizationSummary): void {
    this.#modalService.open<OrganizationDeleteModalComponent, boolean>(
      OrganizationDeleteModalComponent,
      {
        data: { organization } satisfies OrganizationDeleteModalData,
        host: {
          title: 'Supprimer une organisation',
        },
      }
    );
  }
}

