import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AvailableApplicationView,
  SubscribedApplicationView,
  SubscriptionStatus,
} from '@sass-hub-v2/shared-types';
import { finalize, firstValueFrom } from 'rxjs';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { GenericTableComponent, GenericTableHeader } from '../generic-table/generic-table.component';
import { ModalService } from '../../services/modal/modal.service';
import { ToastService } from '../../services/toast/toast.service';
import {
  OrganizationApplicationSubscribeModalComponent,
  OrganizationApplicationSubscribeModalResult,
} from './organization-application-subscribe-modal.component';
import { ConfirmModalComponent, ConfirmModalData } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-organization-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent],
  templateUrl: './organization-applications.component.html',
})
export class OrganizationApplicationsComponent {
  readonly #organizationStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);
  readonly #toastService = inject(ToastService);

  readonly applications = this.#organizationStore.applications;
  readonly applicationsLoading = this.#organizationStore.applicationsLoading;
  readonly selectedOrganizationId = this.#organizationStore.selectedOrganizationId;

  readonly searchTerm = signal('');
  readonly unsubscribeState = signal<Record<string, boolean>>({});

  readonly tableHeaders = signal<GenericTableHeader[]>([
    { key: 'application', label: 'Application', align: 'left' },
    { key: 'statuses', label: 'Statuts', align: 'left', widthClass: 'w-56' },
    { key: 'period', label: 'Période', align: 'left', widthClass: 'w-56' },
    { key: 'actions', label: 'Actions', align: 'right', srOnly: true },
  ]);

  readonly filteredApplications = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const apps = this.applications();

    if (!term) {
      return apps;
    }

    return apps.filter((app) => {
      const haystack = [app.name, app.slug, app.description ?? '', app.category ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });

  readonly emptyStateMessage = computed(() => {
    if (!this.selectedOrganizationId()) {
      return 'Sélectionnez une organisation pour afficher ses applications.';
    }
    if (this.applicationsLoading()) {
      return 'Chargement des applications…';
    }
    return 'Aucune application souscrite pour le moment.';
  });

  readonly subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'Active',
    [SubscriptionStatus.PENDING]: 'En attente',
    [SubscriptionStatus.CANCELLED]: 'Annulée',
    [SubscriptionStatus.EXPIRED]: 'Expirée',
  };

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  trackApplication(_index: number, application: SubscribedApplicationView): string {
    return application.subscriptionId;
  }

  statusBadgeClass(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-green-100 text-green-700';
      case SubscriptionStatus.PENDING:
        return 'bg-blue-100 text-blue-700';
      case SubscriptionStatus.CANCELLED:
        return 'bg-gray-200 text-gray-600';
      case SubscriptionStatus.EXPIRED:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  async openSubscribeModal(): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const modalRef = this.#modalService.open<
      OrganizationApplicationSubscribeModalComponent,
      OrganizationApplicationSubscribeModalResult | undefined
    >(OrganizationApplicationSubscribeModalComponent, {
      data: { organizationId },
      host: {
        title: 'Souscrire à une application',
      },
    });

    const result = await firstValueFrom(modalRef.afterClosed());
    if (!result) {
      return;
    }

    this.#toastService.success('Application souscrite avec succès.');
  }

  async confirmUnsubscribe(application: SubscribedApplicationView): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = await this.#confirmAction(
      {
        description: `Confirmez la désinstallation de l’application « ${application.name} ».`,
        confirmLabel: 'Désinstaller',
        cancelLabel: 'Annuler',
      },
      'Désinstaller une application',
    );

    if (!confirmed) {
      return;
    }

    const current = { ...this.unsubscribeState() };
    current[application.subscriptionId] = true;
    this.unsubscribeState.set(current);

    this.#organizationStore
      .unsubscribeFromApplication(organizationId, application.subscriptionId)
      .pipe(
        finalize(() => {
          const map = { ...this.unsubscribeState() };
          delete map[application.subscriptionId];
          this.unsubscribeState.set(map);
        }),
      )
      .subscribe({
        next: () => {
          this.#toastService.success('Application désinstallée.');
        },
        error: (error) => {
          this.#toastService.error(this.#extractErrorMessage(error));
        },
      });
  }

   async #confirmAction(data: ConfirmModalData, title: string): Promise<boolean> {
    const ref = this.#modalService.open<ConfirmModalComponent, boolean>(ConfirmModalComponent, {
      data,
      host: { title },
    });
    const result = await firstValueFrom(ref.afterClosed());
    return result ?? false;
  }

   #extractErrorMessage(error: unknown): string {
    if (!error) {
      return 'Une erreur inattendue est survenue.';
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error: unknown }).error === 'object'
    ) {
      const payload = (error as { error: { message?: string } }).error;
      if (payload?.message) {
        return payload.message;
      }
    }
    return 'Impossible de traiter la requête.';
  }
}

