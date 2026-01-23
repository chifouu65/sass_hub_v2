import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ModalService } from '@sass-hub-v2/ui-kit';
import {
  OrganizationManageModalComponent,
  OrganizationManageModalData,
} from '../../components/organization-manage-modal/organization-manage-modal.component';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';

@Component({
  selector: 'app-organizations-empty',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './organizations-empty.html',
  styleUrl: './organizations-empty.css',
})
export class OrganizationsEmptyComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);
  readonly #router = inject(Router);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly loading = this.#organizationRolesStore.loading;

  constructor() {
    this.#organizationRolesStore.loadOrganizations();
    effect(() => {
      if (!this.loading() && this.organizations().length) {
        this.#router.navigate(['/organizations']);
      }
    });
  }

  openCreateModal(): void {
    this.#modalService.open<OrganizationManageModalComponent, boolean>(
      OrganizationManageModalComponent,
      {
        data: { mode: 'create' } satisfies OrganizationManageModalData,
        host: {
          title: 'Créer une organisation',
        },
      },
    );
  }
}
