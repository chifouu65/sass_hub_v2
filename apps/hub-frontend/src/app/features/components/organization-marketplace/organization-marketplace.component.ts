import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AvailableApplicationView } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ErrorMessageService } from '../../../core/services/error-message.service';
import { ToastService } from '../../services/toast/toast.service';
import { OrganizationMarketplaceAppCardComponent } from './organization-marketplace-app-card.component';
import { SectionShellComponent, SearchTableToolbarComponent } from '@sass-hub-v2/ui-kit';
import { firstValueFrom, of } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    OrganizationMarketplaceAppCardComponent,
    SectionShellComponent,
    SearchTableToolbarComponent
  ],
  template: `
    <lib-section-shell title="Marketplace" description="Explorez et installez de nouvelles applications.">
      <div class="mb-6">
        <lib-search-table-toolbar
          searchId="marketplace-search"
          label="Rechercher une application"
          placeholder="Rechercher une application..."
          (valueChange)="onSearch($event)"
        >
          <!-- Filtres futurs ici -->
        </lib-search-table-toolbar>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="h-64 rounded-xl bg-slate-100 animate-pulse"></div>
          <div class="h-64 rounded-xl bg-slate-100 animate-pulse"></div>
          <div class="h-64 rounded-xl bg-slate-100 animate-pulse"></div>
        </div>
      } @else if (error()) {
        <div class="rounded-lg bg-red-50 p-4 text-red-700">
          <p class="font-medium">Une erreur est survenue lors du chargement des applications.</p>
          <p class="text-sm mt-1">{{ error() }}</p>
          <button (click)="retry()" class="mt-3 text-sm underline hover:text-red-800">Réessayer</button>
        </div>
      } @else if (filteredApplications().length === 0) {
        <div class="text-center py-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
          <i class="mdi mdi-cube-off-outline text-4xl text-slate-300 mb-3"></i>
          <p class="text-slate-500">Aucune application trouvée.</p>
          @if (searchTerm()) {
            <p class="text-sm text-slate-400 mt-1">Essayez une autre recherche.</p>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (app of filteredApplications(); track app.id) {
            <app-organization-marketplace-app-card
              [app]="app"
              [processing]="(installingState()[app.id] || false)"
              (install)="onInstall(app)"
            />
          }
        </div>
      }
    </lib-section-shell>
  `
})
export class OrganizationMarketplaceComponent {
  readonly #organizationStore = inject(OrganizationRolesService);
  readonly #toastService = inject(ToastService);
  readonly #errorMessage = inject(ErrorMessageService);

  readonly selectedOrganizationId = this.#organizationStore.selectedOrganizationId;
  readonly installingState = signal<Record<string, boolean>>({});
  readonly searchTerm = signal('');

  readonly applicationsResource = rxResource<AvailableApplicationView[], string | null>({
    params: () => this.selectedOrganizationId(),
    stream: ({ params }) => {
      if (!params) return of([]);
      return this.#organizationStore.fetchAvailableApplications(params);
    }
  });

  readonly applications = computed(() => this.applicationsResource.value() ?? []);
  readonly loading = computed(() => this.applicationsResource.isLoading());
  readonly error = computed(() => this.applicationsResource.error() ? this.#errorMessage.getMessage(this.applicationsResource.error()) : null);

  readonly filteredApplications = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const apps = this.applications();

    if (!term) return apps;

    return apps.filter(app => 
      app.name.toLowerCase().includes(term) ||
      (app.description?.toLowerCase().includes(term)) ||
      (app.category?.toLowerCase().includes(term))
    );
  });

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  retry(): void {
    this.applicationsResource.reload();
  }

  async onInstall(app: AvailableApplicationView): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) return;

    this.installingState.update(state => ({ ...state, [app.id]: true }));

    try {
      await firstValueFrom(
        this.#organizationStore.subscribeToApplication(organizationId, app.id)
      );
      this.#toastService.success(`Application ${app.name} installée avec succès.`);
      // Recharger pour mettre à jour la liste (l'app installée ne devrait plus apparaître si l'API filtre bien)
      this.applicationsResource.reload();
    } catch (err) {
      this.#toastService.error(this.#errorMessage.getMessage(err));
    } finally {
      this.installingState.update(state => {
        const newState = { ...state };
        delete newState[app.id];
        return newState;
      });
    }
  }
}
