import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrganizationRoleView, PermissionView } from '@sass-hub-v2/shared-types';
import { slugify } from '@sass-hub-v2/utils';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';
import { ToastService } from '../../services/toast/toast.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../confirm-modal/confirm-modal.component';
import { ModalService } from '../../services/modal/modal.service';

export interface OrganizationRoleUpdateModalData {
  organizationId: string;
  role: OrganizationRoleView;
  permissions: PermissionView[];
}

@Component({
  standalone: true,
  selector: 'app-organization-role-update-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700" for="role-name">
          Nom du rôle
        </label>
        <input
          id="role-name"
          type="text"
          class="form-input"
          formControlName="name"
          (input)="onNameInput()"
          autocomplete="off"
        />
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <p class="text-xs text-red-600">
            Fournissez un nom d’au moins 2 caractères.
          </p>
        }
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700" for="role-slug">
          Slug
        </label>
        <input
          id="role-slug"
          type="text"
          class="form-input"
          formControlName="slug"
          (input)="onSlugInput()"
          (blur)="onSlugBlur()"
          autocomplete="off"
        />
        @if (form.controls.slug.invalid && form.controls.slug.touched) {
          <p class="text-xs text-red-600">
            Le slug doit contenir uniquement des minuscules, chiffres ou tirets.
          </p>
        }
      </div>

      <div class="space-y-2">
        <label
          class="block text-sm font-medium text-slate-700"
          for="role-description"
        >
          Description
        </label>
        <textarea
          id="role-description"
          formControlName="description"
          rows="3"
          class="form-textarea resize-none"
          placeholder="Décrivez brièvement le rôle (facultatif)"
        ></textarea>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-700">
            Permissions associées
          </span>
          <span class="text-xs text-slate-500">
            {{ permissionsSelectedLabel() }}
          </span>
        </div>

        @if (permissions.length === 0) {
          <div
            class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
          >
            Aucune permission disponible pour le moment.
          </div>
        } @else {
          <div class="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <ul class="divide-y divide-slate-200">
              @for (permission of permissions; track permission.id) {
                <li class="bg-white px-4 py-3 hover:bg-slate-50">
                  <label class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      [checked]="isPermissionSelected(permission.code)"
                      (change)="
                        togglePermission(
                          permission.code,
                          $any($event.target).checked
                        )
                      "
                    />
                    <span class="text-sm">
                      <span class="font-semibold text-slate-900">
                        {{ permission.name }}
                      </span>
                      <span
                        class="block text-xs uppercase tracking-wide text-indigo-600"
                      >
                        {{ permission.code }}
                      </span>
                      @if (permission.description) {
                        <span class="mt-1 block text-xs text-slate-500">
                          {{ permission.description }}
                        </span>
                      }
                    </span>
                  </label>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      @if (roleFormError(); as errorMessage) {
        <div
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>
      }

      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" (click)="close()">
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || submitting()"
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
          Mettre à jour
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationRoleUpdateModalComponent {
  readonly #data = inject<OrganizationRoleUpdateModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<ModalRef<OrganizationRoleUpdateModalComponent, void>>(ModalRef);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #store = inject(OrganizationRolesService);
  readonly #toast = inject(ToastService);
  readonly #modalService = inject(ModalService);

  readonly permissions = this.#data.permissions;
  readonly role = this.#data.role;

  readonly form = this.#fb.group({
    name: [
      this.role.name,
      [Validators.required, Validators.minLength(2)],
    ],
    slug: [
      this.role.slug,
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    description: [this.role.description ?? ''],
    permissions: this.#fb.control<string[]>([...this.role.permissions]),
  });

  readonly submitting = signal(false);
  readonly roleFormError = signal<string | null>(null);
  readonly #slugManuallyEdited = signal(false);

  readonly permissionsSelectedLabel = computed(() => {
    const count = this.permissionsControl.value?.length ?? 0;
    return `${count} permission${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
  });

  get permissionsControl() {
    return this.form.controls.permissions;
  }

  onNameInput(): void {
    if (this.#slugManuallyEdited()) {
      return;
    }
    const nameValue = this.form.controls.name.value;
    this.form.controls.slug.setValue(slugify(nameValue));
  }

  onSlugInput(): void {
    this.#slugManuallyEdited.set(true);
    const value = this.form.controls.slug.value;
    this.form.controls.slug.setValue(slugify(value));
  }

  onSlugBlur(): void {
    const value = this.form.controls.slug.value;
    this.form.controls.slug.setValue(slugify(value));
  }

  togglePermission(code: string, checked: boolean): void {
    const current = this.permissionsControl.value ?? [];
    if (checked && !current.includes(code)) {
      this.permissionsControl.setValue([...current, code]);
    }
    if (!checked && current.includes(code)) {
      this.permissionsControl.setValue(
        current.filter((permission) => permission !== code)
      );
    }
  }

  isPermissionSelected(code: string): boolean {
    const current = this.permissionsControl.value ?? [];
    return current.includes(code);
  }

  async onSubmit(): Promise<void> {
    this.roleFormError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      name,
      slug,
      description,
      permissions: selectedPermissions,
    } = this.form.getRawValue();

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedDescription = description?.trim() ?? '';

    const payload: {
      name?: string;
      slug?: string;
      description?: string | null;
    } = {};

    if (trimmedName !== this.role.name) {
      payload.name = trimmedName;
    }

    if (trimmedSlug !== this.role.slug) {
      payload.slug = trimmedSlug;
    }

    if ((this.role.description ?? '') !== trimmedDescription) {
      payload.description = trimmedDescription ? trimmedDescription : null;
    }

    const normalizedSelection = [...(selectedPermissions ?? [])].sort();
    const normalizedExisting = [...this.role.permissions].sort();
    const permissionsChanged =
      normalizedSelection.length !== normalizedExisting.length ||
      normalizedSelection.some((permission, index) => permission !== normalizedExisting[index]);

    const actionDescriptionParts: string[] = [];
    if (Object.keys(payload).length > 0) {
      actionDescriptionParts.push('les métadonnées du rôle');
    }
    if (permissionsChanged) {
      actionDescriptionParts.push('les permissions du rôle');
    }

    if (!actionDescriptionParts.length) {
      this.#toast.info('Aucune modification détectée.');
      this.close();
      return;
    }

    const confirmed = await this.#confirmAction({
      description: `Confirmez la mise à jour de ${actionDescriptionParts.join(
        ' et '
      )} pour « ${this.role.name} ».`, 
      confirmLabel: 'Mettre à jour',
      cancelLabel: 'Annuler',
    });

    if (!confirmed) {
      return;
    }

    this.submitting.set(true);

    try {
      if (Object.keys(payload).length > 0) {
        await firstValueFrom(
          this.#store.updateRole(this.#data.organizationId, this.role.id, payload)
        );
      }

      if (permissionsChanged) {
        await firstValueFrom(
          this.#store.updateRolePermissions(
            this.#data.organizationId,
            this.role.id,
            normalizedSelection
          )
        );
      }

      this.#toast.success('Rôle mis à jour avec succès.');
      this.close();
    } catch (error) {
      this.roleFormError.set(this.#resolveErrorMessage(error));
      this.#toast.error(this.#resolveErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  close(): void {
    this.#modalRef.close();
  }

  async #confirmAction(data: ConfirmModalData): Promise<boolean> {
    const ref = this.#modalService.open<ConfirmModalComponent, boolean>(
      ConfirmModalComponent,
      {
        data,
        host: {
          title: 'Mettre à jour un rôle',
        },
      }
    );

    const result = await firstValueFrom(ref.afterClosed());
    return result ?? false;
  }

  #resolveErrorMessage(error: unknown): string {
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

