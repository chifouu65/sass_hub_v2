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
import { OrganizationMarketplaceComponent } from '../../components/organization-marketplace/organization-marketplace.component';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';

type TabId = 'organizations' | 'applications' | 'marketplace' | 'members' | 'roles';

@Component({
  selector: 'app-organizations',
  imports: [
    CommonModule,
    RouterModule,
    OrganizationTableComponent,
    OrganizationMembersComponent,
    OrganizationRolesComponent,
    OrganizationApplicationsComponent,
    OrganizationMarketplaceComponent,
  ],
  templateUrl: './organizations.html',
  styleUrls: ['./organizations.css'],
})
export class OrganizationsComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #router = inject(Router);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId = this.#organizationRolesStore.selectedOrganizationId;
  readonly loading = this.#organizationRolesStore.loading;
  readonly error = this.#organizationRolesStore.error;

  readonly tabs: ReadonlyArray<{ id: TabId; label: string; icon: string }> = [
    { id: 'organizations', label: 'Organisations', icon: 'mdi-office-building' },
    { id: 'applications', label: 'Mes Applications', icon: 'mdi-apps' },
    { id: 'marketplace', label: 'Marketplace', icon: 'mdi-store' },
    { id: 'members', label: 'Membres', icon: 'mdi-account-multiple' },
    { id: 'roles', label: 'Rôles', icon: 'mdi-shield-account' },
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

  setActiveTab(tab: string): void {
    this.activeTab.set(tab as TabId);
  }

  isActiveTab(tab: string): boolean {
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
