import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OrganizationRolesService, OrganizationSummary } from '../../../core/services/organization-roles.service';
import { ModalService } from '../../services/modal/modal.service';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { OrganizationDeleteModalComponent, OrganizationDeleteModalData } from '../../components/organization-delete-modal/organization-delete-modal.component';
import { OrganizationManageModalComponent, OrganizationManageModalData } from '../../components/organization-manage-modal/organization-manage-modal.component';
import { OrganizationMembersComponent } from '../../components/organization-members/organization-members.component';
import { OrganizationRolesComponent } from '../../components/organization-roles/organization-roles.component';
import { GenericTableComponent, GenericTableHeader } from '../../components/generic-table/generic-table.component';

@Component({
  selector: 'app-organizations',
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    SkeletonComponent,
    OrganizationMembersComponent,
    OrganizationRolesComponent,
    GenericTableComponent,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly loading = this.#organizationRolesStore.loading;
  readonly error = this.#organizationRolesStore.error;
  readonly tableHeaders: GenericTableHeader[] = [
    { key: 'name', label: 'Organisation', align: 'left' },
    { key: 'slug', label: 'Slug', align: 'left' },
    { key: 'db', label: 'Base de données', align: 'left' },
    { key: 'updatedAt', label: 'Dernière mise à jour', align: 'left' },
    { key: 'actions', label: 'Actions', align: 'right', srOnly: true },
  ];
  readonly tableSkeletonRows = 4;

  constructor() {
    this.#organizationRolesStore.loadOrganizations();
  }

  onSelectOrganization(id: string): void {
    this.#organizationRolesStore.selectOrganization(id);
  }

  onRefresh(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  onOrganizationSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.onSelectOrganization(value);
    }
  }

  trackOrganization(_: number, organization: OrganizationSummary): string {
    return organization.id;
  }

  findOrganizationName(currentId: string): string {
    return (
      this.#organizationRolesStore
        .organizations()
        .find((organization) => organization.id === currentId)?.name ?? '—'
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
