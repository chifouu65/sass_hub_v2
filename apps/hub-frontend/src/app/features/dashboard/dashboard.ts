import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  OrganizationRoleView,
  OrganizationRolesStore,
} from '../../core/services/organization-roles';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly #organizationRolesStore = inject(OrganizationRolesStore);
  readonly #fb = inject(NonNullableFormBuilder);
  
  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId = this.#organizationRolesStore.selectedOrganizationId;
  readonly roles = this.#organizationRolesStore.roles;
  readonly permissions = this.#organizationRolesStore.permissions;
  readonly loading = this.#organizationRolesStore.loading;
  readonly error = this.#organizationRolesStore.error;

  readonly createRoleForm = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    description: [''],
    permissions: this.#fb.control<string[]>([]),
  });
  readonly permissionsControl = this.createRoleForm.controls.permissions;

  readonly slugManuallyEdited = signal(false);
  readonly formMessage = signal<{ text: string; kind: 'success' | 'error' } | null>(null);
  readonly createSubmitting = signal(false);
  readonly deleteInProgress = signal<string | null>(null);

  constructor() {
    this.#organizationRolesStore.loadOrganizations();
  }

  onOrganizationChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.#organizationRolesStore.selectOrganization(value);
  }

  refreshOrganization(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  onNameInput(): void {
    if (this.slugManuallyEdited()) {
      return;
    }
    const name = this.createRoleForm.controls.name.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(name));
  }

  onSlugInput(): void {
    this.slugManuallyEdited.set(true);
    const value = this.createRoleForm.controls.slug.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(value));
  }

  onSlugBlur(): void {
    const value = this.createRoleForm.controls.slug.value;
    this.createRoleForm.controls.slug.setValue(this.#slugify(value));
  }

  togglePermission(permissionCode: string, checked: boolean): void {
    const current = this.permissionsControl.value ?? [];
    if (checked && !current.includes(permissionCode)) {
      this.permissionsControl.setValue([...current, permissionCode]);
    }
    if (!checked && current.includes(permissionCode)) {
      this.permissionsControl.setValue(
        current.filter((code) => code !== permissionCode),
      );
    }
  }

  isPermissionSelected(permissionCode: string): boolean {
    return this.permissionsControl.value?.includes(permissionCode) ?? false;
  }

  onCreateRole(): void {
    this.formMessage.set(null);
    if (this.createRoleForm.invalid) {
      this.createRoleForm.markAllAsTouched();
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.formMessage.set({
        kind: 'error',
        text: 'Sélectionnez une organisation pour créer un rôle.',
      });
      return;
    }

    const { name, slug, description, permissions } =
      this.createRoleForm.getRawValue();

    this.createSubmitting.set(true);
    this.#organizationRolesStore
      .createRole(organizationId, {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() ? description.trim() : undefined,
        permissions,
      })
      .pipe(finalize(() => this.createSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.formMessage.set({
            kind: 'success',
            text: 'Rôle créé avec succès.',
          });
          this.createRoleForm.reset({
            name: '',
            slug: '',
            description: '',
            permissions: [],
          });
          this.slugManuallyEdited.set(false);
        },
        error: (error) => {
          this.formMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  deleteRole(role: OrganizationRoleView): void {
    if (role.isSystem) {
      return;
    }
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer le rôle "${role.name}" ? Cette action est irréversible.`,
    );
    if (!confirmed) {
      return;
    }

    this.deleteInProgress.set(role.id);
    this.#organizationRolesStore
      .deleteRole(organizationId, role.id)
      .pipe(finalize(() => this.deleteInProgress.set(null)))
      .subscribe({
        next: () => {
          this.formMessage.set({
            kind: 'success',
            text: `Le rôle "${role.name}" a été supprimé.`,
          });
        },
        error: (error) => {
          this.formMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  permissionCountLabel(permissions: string[]): string {
    if (!permissions.length) {
      return 'Aucune permission';
    }
    return `${permissions.length} permission${permissions.length > 1 ? 's' : ''}`;
  }

  #slugify(value: string) {
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
