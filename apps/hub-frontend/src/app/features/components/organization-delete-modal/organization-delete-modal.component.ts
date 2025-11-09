import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';
import { ToastService } from '../../services/toast/toast.service';
import { firstValueFrom } from 'rxjs';

export interface OrganizationDeleteModalData {
  organization: OrganizationSummary;
}

@Component({
  standalone: true,
  selector: 'app-organization-delete-modal',
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="space-y-2">
        <h3 class="text-base font-semibold text-slate-900">
          Supprimer l’organisation ?
        </h3>
        <p class="text-sm text-slate-600">
          Cette action supprimera l’organisation
          <span class="font-medium text-slate-900">{{ data.organization.name }}</span>.
          Cette opération est irréversible.
        </p>
        <ul class="text-xs text-slate-500 space-y-1">
          <li>• Slug : {{ data.organization.slug }}</li>
          <li>
            • Base de données : {{ data.organization.databaseName || '—' }}
          </li>
        </ul>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="close(false)"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-danger"
          (click)="onConfirm()"
          [disabled]="submitting()"
        >
          @if (submitting()) {
            <svg
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          }
          Supprimer
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDeleteModalComponent {
  readonly data = inject<OrganizationDeleteModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<ModalRef<OrganizationDeleteModalComponent, boolean>>(ModalRef);
  readonly #store = inject(OrganizationRolesService);
  readonly #toast = inject(ToastService);

  readonly submitting = signal(false);

  async onConfirm(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    try {
      await firstValueFrom(
        this.#store.deleteOrganization(this.data.organization.id)
      );
      this.#toast.success('Organisation supprimée.');
      this.close(true);
    } catch (error) {
      this.#toast.error(this.#extractErrorMessage(error));
      this.submitting.set(false);
    }
  }

  close(result: boolean): void {
    this.#modalRef.close(result);
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

