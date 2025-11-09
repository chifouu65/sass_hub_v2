import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  OrganizationRoleView,
  OrganizationRolesStore,
} from '../../../../core/services/organization-roles';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton';
import { ModalService } from '../../../../shared/modal/modal.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organization-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, SkeletonComponent],
  templateUrl: './organization-roles.component.html',
})
export class OrganizationRolesComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesStore);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #modalService = inject(ModalService);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly roles = this.#organizationRolesStore.roles;
  readonly permissions = this.#organizationRolesStore.permissions;
  readonly error = this.#organizationRolesStore.error;
  readonly loading = this.#organizationRolesStore.loading;

  readonly createRoleForm = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    description: [''],
    permissions: this.#fb.control<string[]>([]),
  });
  readonly permissionsControl = this.createRoleForm.controls.permissions;
  readonly roleFormMessage = signal<{
    text: string;
    kind: 'success' | 'error';
  } | null>(null);
  readonly createRoleSubmitting = signal(false);
  readonly deleteRoleInProgress = signal<string | null>(null);

  readonly roleSkeletonRows = Array.from({ length: 4 });
  readonly roleSkeletonLines = Array.from({ length: 3 });

  readonly #slugManuallyEditedRole = signal(false);

  onRefresh(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  onOrganizationSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.#organizationRolesStore.selectOrganization(value);
    }
  }

  onRoleNameInput(): void {
    if (this.#slugManuallyEditedRole()) {
      return;
    }
    const name = this.createRoleForm.controls.name.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(name));
  }

  onRoleSlugInput(): void {
    this.#slugManuallyEditedRole.set(true);
    const value = this.createRoleForm.controls.slug.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(value));
  }

  onRoleSlugBlur(): void {
    const value = this.createRoleForm.controls.slug.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(value));
  }

  async onCreateRole(): Promise<void> {
    this.roleFormMessage.set(null);
    if (this.createRoleForm.invalid) {
      this.createRoleForm.markAllAsTouched();
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.roleFormMessage.set({
        kind: 'error',
        text: 'Sélectionnez une organisation pour créer un rôle.',
      });
      return;
    }

    const { name, slug, description, permissions } =
      this.createRoleForm.getRawValue();

    const confirmed = await this.#confirmAction(
      {
        description: `Confirmez la création du rôle "${name.trim()}" (${
          permissions.length
        } permission${permissions.length > 1 ? 's' : ''}).`,
        confirmLabel: 'Créer',
        cancelLabel: 'Annuler',
      },
      'Créer un rôle'
    );

    if (!confirmed) {
      return;
    }

    this.createRoleSubmitting.set(true);
    this.#organizationRolesStore
      .createRole(organizationId, {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() ? description.trim() : undefined,
        permissions,
      })
      .pipe(finalize(() => this.createRoleSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.roleFormMessage.set({
            kind: 'success',
            text: 'Rôle créé avec succès.',
          });
          this.createRoleForm.reset({
            name: '',
            slug: '',
            description: '',
            permissions: [],
          });
          this.#slugManuallyEditedRole.set(false);
        },
        error: (error) => {
          this.roleFormMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  async deleteRole(role: OrganizationRoleView): Promise<void> {
    if (role.isSystem) {
      return;
    }
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = await this.#confirmAction(
      {
        description: `Le rôle "${role.name}" sera supprimé définitivement.`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
      },
      'Supprimer un rôle'
    );
    if (!confirmed) {
      return;
    }

    this.deleteRoleInProgress.set(role.id);
    this.#organizationRolesStore
      .deleteRole(organizationId, role.id)
      .pipe(finalize(() => this.deleteRoleInProgress.set(null)))
      .subscribe({
        next: () => {
          this.roleFormMessage.set({
            kind: 'success',
            text: `Le rôle "${role.name}" a été supprimé.`,
          });
        },
        error: (error) => {
          this.roleFormMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  togglePermission(permissionCode: string, checked: boolean): void {
    const current = this.permissionsControl.value ?? [];
    if (checked && !current.includes(permissionCode)) {
      this.permissionsControl.setValue([...current, permissionCode]);
    }
    if (!checked && current.includes(permissionCode)) {
      this.permissionsControl.setValue(
        current.filter((code) => code !== permissionCode)
      );
    }
  }

  isPermissionSelected(permissionCode: string): boolean {
    const current = this.permissionsControl.value;
    return current ? current.includes(permissionCode) : false;
  }

  get permissionsSelectedCount(): number {
    const current = this.permissionsControl.value;
    return current ? current.length : 0;
  }

  get permissionsSelectedLabel(): string {
    const count = this.permissionsSelectedCount;
    return `${count} sélectionnée${count > 1 ? 's' : ''}`;
  }

  async #confirmAction(
    data: ConfirmModalData,
    hostTitle: string
  ): Promise<boolean> {
    const modalRef = this.#modalService.open<ConfirmModalComponent, boolean>(
      ConfirmModalComponent,
      {
        data,
        host: {
          title: hostTitle,
        },
      }
    );

    const result = await firstValueFrom(modalRef.afterClosed());
    return result ?? false;
  }

  #slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
