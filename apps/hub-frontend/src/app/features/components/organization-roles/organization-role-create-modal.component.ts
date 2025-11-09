import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  PermissionView,
  OrganizationRolesService,
} from '../../../core/services/organization-roles.service';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';
import { ToastService } from '../../services/toast/toast.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../confirm-modal/confirm-modal.component';
import { ModalService } from '../../services/modal/modal.service';

export interface OrganizationRoleCreateModalData {
  organizationId: string;
  organizationName: string;
  permissions: PermissionView[];
}

@Component({
  standalone: true,
  selector: 'app-organization-role-create-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-role-create-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationRoleCreateModalComponent {
  readonly #data =
    inject<OrganizationRoleCreateModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<ModalRef<OrganizationRoleCreateModalComponent, boolean>>(ModalRef);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #store = inject(OrganizationRolesService);
  readonly #toast = inject(ToastService);
  readonly #modalService = inject(ModalService);

  readonly permissions = this.#data.permissions;
  readonly organizationName = this.#data.organizationName;

  readonly form = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    description: [''],
    permissions: this.#fb.control<string[]>([]),
  });
  readonly submitting = signal(false);
  readonly roleFormError = signal<string | null>(null);
  readonly roleFormSuccess = signal<string | null>(null);
  readonly #slugManuallyEdited = signal(false);

  get permissionsControl() {
    return this.form.controls.permissions;
  }

  get permissionsSelectedLabel(): string {
    const count = this.permissionsControl.value?.length ?? 0;
    return `${count} permission${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
  }

  onNameInput(): void {
    if (this.#slugManuallyEdited()) {
      return;
    }
    const name = this.form.controls.name.value;
    this.form.controls.slug.setValue(this.#slugify(name));
  }

  onSlugInput(): void {
    this.#slugManuallyEdited.set(true);
    const value = this.form.controls.slug.value;
    this.form.controls.slug.setValue(this.#slugify(value));
  }

  onSlugBlur(): void {
    const value = this.form.controls.slug.value;
    this.form.controls.slug.setValue(this.#slugify(value));
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
    this.roleFormSuccess.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, slug, description, permissions } = this.form.getRawValue();

    const confirmed = await this.#confirmAction({
      description: `Confirmez la création du rôle « ${name.trim()} » (${permissions.length} permission${permissions.length > 1 ? 's' : ''}).`,
      confirmLabel: 'Créer',
      cancelLabel: 'Annuler',
    });

    if (!confirmed) {
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.#store.createRole(this.#data.organizationId, {
          name: name.trim(),
          slug: slug.trim(),
          description: description?.trim() ? description.trim() : undefined,
          permissions,
        })
      );
      this.#toast.success('Rôle créé avec succès.');
      this.roleFormSuccess.set('Rôle créé avec succès.');
      this.close(true);
    } catch (error) {
      this.roleFormError.set(this.#resolveErrorMessage(error));
      this.#toast.error(this.#resolveErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  close(result: boolean = false): void {
    this.#modalRef.close(result);
  }

  #slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async #confirmAction(data: ConfirmModalData): Promise<boolean> {
    const ref = this.#modalService.open<ConfirmModalComponent, boolean>(
      ConfirmModalComponent,
      {
        data,
        host: {
          title: 'Créer un rôle',
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

