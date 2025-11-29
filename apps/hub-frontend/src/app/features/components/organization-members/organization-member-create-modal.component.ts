import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ModalRef } from '@sass-hub-v2/ui-kit';
import { MODAL_DATA } from '@sass-hub-v2/ui-kit';
import { OrganizationMemberRoleModalOption } from './organization-member-role-modal.component';

export interface OrganizationMemberCreateModalResult {
  email: string;
  assignment: string;
}

export interface OrganizationMemberCreateModalData {
  options: OrganizationMemberRoleModalOption[];
}

@Component({
  standalone: true,
  selector: 'app-organization-member-create-modal',
  imports: [CommonModule],
  template: `
    <form class="space-y-6" (submit)="onSubmit($event)">
      <div class="space-y-2">
        <label
          for="member-email-input"
          class="block text-sm font-medium text-gray-700"
        >
          Email utilisateur
        </label>
        <input
          id="member-email-input"
          type="email"
          class="form-input"
          [value]="email()"
          (input)="onEmailInput($event)"
          (blur)="emailTouched.set(true)"
          placeholder="utilisateur@example.com"
          autocomplete="off"
        />
        @if (showEmailError()) {
          <p class="text-xs text-red-600">
            Fournissez un email valide.
          </p>
        }
      </div>

      <div class="space-y-2">
        <label
          for="member-role-select"
          class="block text-sm font-medium text-gray-700"
        >
          Rôle attribué
        </label>
        <select
          id="member-role-select"
          class="form-select"
          [value]="assignment()"
          (change)="onAssignmentChange($event)"
          (blur)="assignmentTouched.set(true)"
        >
          <option value="" disabled>Choisissez un rôle</option>
          @for (option of data.options; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
        @if (showAssignmentError()) {
          <p class="text-xs text-red-600">
            Sélectionnez un rôle pour ce membre.
          </p>
        }
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
          type="submit"
          class="btn btn-primary"
          [disabled]="!canSubmit()"
        >
          Ajouter le membre
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMemberCreateModalComponent {
  readonly data = inject<OrganizationMemberCreateModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<
      ModalRef<OrganizationMemberCreateModalComponent, OrganizationMemberCreateModalResult | undefined>
    >(ModalRef);

  readonly email = signal('');
  readonly assignment = signal('');
  readonly emailTouched = signal(false);
  readonly assignmentTouched = signal(false);

  readonly canSubmit = computed(
    () => this.isEmailValid() && this.assignment().length > 0
  );

  readonly showEmailError = computed(
    () => this.emailTouched() && !this.isEmailValid()
  );

  readonly showAssignmentError = computed(
    () => this.assignmentTouched() && !this.assignment().length
  );

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
  }

  onAssignmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assignment.set(value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.emailTouched.set(true);
    this.assignmentTouched.set(true);
    if (!this.canSubmit()) {
      return;
    }

    this.close({
      email: this.email().trim(),
      assignment: this.assignment(),
    });
  }

  close(result: OrganizationMemberCreateModalResult | undefined): void {
    this.#modalRef.close(result);
  }

  private isEmailValid(): boolean {
    const value = this.email().trim();
    if (!value) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

