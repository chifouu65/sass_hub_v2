import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  OrganizationRolesStore,
} from '../../core/services/organization-roles';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton';
import { OrganizationCreateComponent } from './components/organization-create/organization-create.component';
import { OrganizationDetailsComponent } from './components/organization-details/organization-details.component';
import { OrganizationMembersComponent } from './components/organization-members/organization-members.component';
import { OrganizationRolesComponent } from './components/organization-roles/organization-roles.component';

@Component({
  selector: 'app-organizations',
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    SkeletonComponent,
    OrganizationCreateComponent,
    OrganizationDetailsComponent,
    OrganizationMembersComponent,
    OrganizationRolesComponent,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesStore);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly loading = this.#organizationRolesStore.loading;
  readonly error = this.#organizationRolesStore.error;
  protected readonly listSkeletonItems = Array.from({ length: 4 });

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
}
