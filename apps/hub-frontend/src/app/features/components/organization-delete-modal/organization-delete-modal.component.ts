import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ErrorMessageService } from '../../../core/services/error-message.service';
import { ModalRef } from '@sass-hub-v2/ui-kit';
import { MODAL_DATA } from '@sass-hub-v2/ui-kit';
import { ToastService } from '../../services/toast/toast.service';
import { firstValueFrom } from 'rxjs';

export interface OrganizationDeleteModalData {
  organization: OrganizationSummary;
}

@Component({
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
            <i class="mdi mdi-loading mdi-spin text-sm"></i>
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
  readonly #errorMessage = inject(ErrorMessageService);

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
      this.#toast.error(this.#errorMessage.getMessage(error));
      this.submitting.set(false);
    }
  }

  close(result: boolean): void {
    this.#modalRef.close(result);
  }

}

