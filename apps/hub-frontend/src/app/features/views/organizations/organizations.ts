import { CommonModule } from '@angular/common';
import { Component, effect, inject, Signal, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  OrganizationRolesService,
} from '../../../core/services/organization-roles.service';
import { OrganizationMembersComponent } from '../../components/organization-members/organization-members.component';
import { OrganizationRolesComponent } from '../../components/organization-roles/organization-roles.component';
import { OrganizationTableComponent } from '../../components/organization-table/organization-table.component';
import { OrganizationApplicationsComponent } from '../../components/organization-applications/organization-applications.component';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';

type TabId = 'organizations' | 'applications' | 'members' | 'roles';

@Component({
  selector: 'app-organizations',
  imports: [
    CommonModule,
    RouterModule,
    OrganizationTableComponent,
    OrganizationMembersComponent,
    OrganizationRolesComponent,
    OrganizationApplicationsComponent,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #router = inject(Router);

  readonly organizations: Signal<OrganizationSummary[]> = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId = this.#organizationRolesStore.selectedOrganizationId;
  readonly loading = this.#organizationRolesStore.loading;
  readonly error = this.#organizationRolesStore.error;

  readonly tabs: ReadonlyArray<{ id: TabId; label: string }> = [
    { id: 'organizations', label: 'Organisations' },
    { id: 'applications', label: 'Applications' },
    { id: 'members', label: 'Membres' },
    { id: 'roles', label: 'Rôles' },
  ];

  readonly activeTab = signal<TabId>('organizations');

  constructor() {
    this.#organizationRolesStore.loadOrganizations();
    effect(() => {
      if (!this.loading() && !this.organizations().length) {
        this.#router.navigate(['/organizations/empty']);
      }
    });
  }

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  isActiveTab(tab: TabId): boolean {
    return this.activeTab() === tab;
  }

  onRefresh(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  onOrganizationSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.#organizationRolesStore.selectOrganization(value);
    }
  }
}
