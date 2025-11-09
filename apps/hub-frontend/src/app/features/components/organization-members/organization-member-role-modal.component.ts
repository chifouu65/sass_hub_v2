import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';

export interface OrganizationMemberRoleModalOption {
  value: string;
  label: string;
}

export interface OrganizationMemberRoleModalData {
  memberLabel: string;
  memberEmail: string;
  currentRoleLabel: string | null;
  currentAssignment: string;
  options: OrganizationMemberRoleModalOption[];
}

@Component({
  standalone: true,
  selector: 'app-organization-member-role-modal',
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-gray-900">
          {{ data.memberLabel }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ data.memberEmail }}
        </p>
        <p class="text-sm text-gray-600">
          Sélectionnez le nouveau rôle à attribuer au membre. Le rôle actuel est :
          <span class="font-medium text-gray-900">{{
            data.currentRoleLabel ?? 'Non défini'
          }}</span>
        </p>
      </div>

      <div class="space-y-2">
        <label
          for="member-role-select"
          class="block text-sm font-medium text-gray-700"
        >
          Nouveau rôle
        </label>
        <select
          id="member-role-select"
          class="form-select"
          [value]="selection()"
          (change)="onSelectionChange($event)"
        >
          <option value="" disabled>Choisissez un rôle</option>
          @for (option of data.options; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="close(undefined)"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="close(selection())"
          [disabled]="!canConfirm()"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMemberRoleModalComponent {
  readonly data = inject<OrganizationMemberRoleModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<ModalRef<OrganizationMemberRoleModalComponent, string | undefined>>(
      ModalRef
    );

  readonly selection = signal(this.data.currentAssignment ?? '');
  readonly canConfirm = computed(
    () =>
      !!this.selection() && this.selection() !== this.data.currentAssignment
  );

  onSelectionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selection.set(value);
  }

  close(result: string | undefined): void {
    this.#modalRef.close(result);
  }
}

