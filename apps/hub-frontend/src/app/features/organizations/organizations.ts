import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  OrganizationMemberView,
  OrganizationRoleView,
  OrganizationRolesStore,
} from '../../core/services/organization-roles';
import { finalize } from 'rxjs/operators';

type AssignmentValue = string;

const BUILT_IN_ROLES: Array<{ value: string; label: string }> = [
  { value: 'role:owner', label: 'Owner (Système)' },
  { value: 'role:admin', label: 'Admin (Système)' },
  { value: 'role:member', label: 'Membre (Système)' },
  { value: 'role:viewer', label: 'Lecteur (Système)' },
];

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsComponent {
   readonly #organizationRolesStore = inject(OrganizationRolesStore);
   readonly #fb = inject(NonNullableFormBuilder);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId = this.#organizationRolesStore.selectedOrganizationId;
  readonly roles = this.#organizationRolesStore.roles;
  readonly members = this.#organizationRolesStore.members;
  readonly loading = this.#organizationRolesStore.loading;
  readonly membersLoading = this.#organizationRolesStore.membersLoading;
  readonly error = this.#organizationRolesStore.error;

  readonly createOrganizationForm = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    databaseName: [''],
  });

  readonly updateOrganizationForm = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    databaseName: [''],
  });

  readonly addMemberForm = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
    assignment: ['', [Validators.required]],
  });

  readonly createSubmitting = signal(false);
  readonly updateSubmitting = signal(false);
  readonly addMemberSubmitting = signal(false);
  readonly memberUpdating = signal<Record<string, boolean>>({});
  readonly memberAssignments = signal<Record<string, AssignmentValue>>({});
  readonly formMessage = signal<{ text: string; kind: 'success' | 'error' } | null>(null);
  readonly orgMessage = signal<{ text: string; kind: 'success' | 'error' } | null>(null);
  readonly deleteSubmitting = signal(false);

   #slugManuallyEditedCreate = signal(false);
   #slugManuallyEditedUpdate = signal(false);

  constructor() {
    this.#organizationRolesStore.loadOrganizations();
   
    effect(() => {
      const organizations = this.organizations();
      const selectedId = this.selectedOrganizationId();
      const selected =
        organizations.find((organization) => organization.id === selectedId) ??
        null;

      if (selected) {
        this.updateOrganizationForm.setValue({
          name: selected.name ?? '',
          slug: selected.slug ?? '',
          databaseName: selected.databaseName ?? '',
        });
        this.#slugManuallyEditedUpdate.set(true);
      } else {
        this.updateOrganizationForm.reset({
          name: '',
          slug: '',
          databaseName: '',
        });
        this.#slugManuallyEditedUpdate.set(false);
      }
    });
  }


  trackById(index: number, item: { id: string }): string {
    return item.id;
  }

  trackByUserId(index: number, item: OrganizationMemberView): string {
    return item.userId;
  }

  onSelectOrganization(id: string): void {
    this.#organizationRolesStore.selectOrganization(id);
    this.orgMessage.set(null);
  }

  onRefresh(): void {
    this.#organizationRolesStore.refreshSelection();
  }

  onCreateNameInput(): void {
    if (this.#slugManuallyEditedCreate()) {
      return;
    }
    const name = this.createOrganizationForm.controls.name.value;
    this.createOrganizationForm.controls.slug.setValue(this.#slugify(name));
  }

  onCreateSlugInput(): void {
    this.#slugManuallyEditedCreate.set(true);
    const value = this.createOrganizationForm.controls.slug.value;
    this.createOrganizationForm.controls.slug.setValue(this.#slugify(value));
  }

  onUpdateNameInput(): void {
    if (this.#slugManuallyEditedUpdate()) {
      return;
    }
    const name = this.updateOrganizationForm.controls.name.value;
    this.updateOrganizationForm.controls.slug.setValue(this.#slugify(name));
  }

  onUpdateSlugInput(): void {
    this.#slugManuallyEditedUpdate.set(true);
    const value = this.updateOrganizationForm.controls.slug.value;
    this.updateOrganizationForm.controls.slug.setValue(this.#slugify(value));
  }

  onCreateOrganization(): void {
    this.formMessage.set(null);
    if (this.createOrganizationForm.invalid) {
      this.createOrganizationForm.markAllAsTouched();
      return;
    }

    const { name, slug, databaseName } = this.createOrganizationForm.getRawValue();
    this.createSubmitting.set(true);
    this.#organizationRolesStore
      .createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        databaseName: databaseName?.trim() || undefined,
      })
      .pipe(finalize(() => this.createSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.formMessage.set({
            kind: 'success',
            text: 'Organisation créée avec succès.',
          });
          this.createOrganizationForm.reset({
            name: '',
            slug: '',
            databaseName: '',
          });
          this.#slugManuallyEditedCreate.set(false);
        },
        error: (error) => {
          this.formMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  onUpdateOrganization(): void {
    this.orgMessage.set(null);
    if (this.updateOrganizationForm.invalid) {
      this.updateOrganizationForm.markAllAsTouched();
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.orgMessage.set({
        kind: 'error',
        text: 'Veuillez sélectionner une organisation.',
      });
      return;
    }

    const { name, slug, databaseName } = this.updateOrganizationForm.getRawValue();
    this.updateSubmitting.set(true);
    this.#organizationRolesStore
      .updateOrganization(organizationId, {
        name: name.trim(),
        slug: slug.trim(),
        databaseName: databaseName?.trim() || undefined,
      })
      .pipe(finalize(() => this.updateSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.orgMessage.set({
            kind: 'success',
            text: 'Organisation mise à jour.',
          });
        },
        error: (error) => {
          this.orgMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  onDeleteOrganization(): void {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = window.confirm(
      'Supprimer cette organisation ? Cette action est irréversible.',
    );
    if (!confirmed) {
      return;
    }

    this.deleteSubmitting.set(true);
    this.#organizationRolesStore
      .deleteOrganization(organizationId)
      .pipe(finalize(() => this.deleteSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.orgMessage.set({
            kind: 'success',
            text: 'Organisation supprimée.',
          });
        },
        error: (error) => {
          this.orgMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  onAddMember(): void {
    this.orgMessage.set(null);
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.orgMessage.set({
        kind: 'error',
        text: 'Veuillez sélectionner une organisation.',
      });
      return;
    }

    const { email, assignment } = this.addMemberForm.getRawValue();
    const payload = this.resolveAssignmentValue(assignment);

    this.addMemberSubmitting.set(true);
    this.#organizationRolesStore
      .addMember(organizationId, {
        email: email.trim(),
        role: payload.role ?? undefined,
        organizationRoleId: payload.organizationRoleId ?? undefined,
      })
      .pipe(finalize(() => this.addMemberSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.orgMessage.set({
            kind: 'success',
            text: 'Utilisateur ajouté à l’organisation.',
          });
          this.addMemberForm.reset({
            email: '',
            assignment: '',
          });
        },
        error: (error) => {
          this.orgMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  onAssignmentChange(userId: string, value: string): void {
    const current = { ...this.memberAssignments() };
    current[userId] = value;
    this.memberAssignments.set(current);
  }

  updateMemberAssignment(member: OrganizationMemberView): void {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const assignment = this.memberAssignments()[member.userId];
    if (!assignment) {
      return;
    }

    const payload = this.resolveAssignmentValue(assignment);
    const map = { ...this.memberUpdating() };
    map[member.userId] = true;
    this.memberUpdating.set(map);

    this.#organizationRolesStore
      .updateMemberRole(organizationId, member.userId, payload)
      .pipe(
        finalize(() => {
          const nextMap = { ...this.memberUpdating() };
          delete nextMap[member.userId];
          this.memberUpdating.set(nextMap);
        }),
      )
      .subscribe({
        next: () => {
          this.orgMessage.set({
            kind: 'success',
            text: 'Rôle du membre mis à jour.',
          });
        },
        error: (error) => {
          this.orgMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  removeMember(member: OrganizationMemberView): void {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = window.confirm(
      `Retirer ${member.email} de cette organisation ?`,
    );
    if (!confirmed) {
      return;
    }

    const map = { ...this.memberUpdating() };
    map[member.userId] = true;
    this.memberUpdating.set(map);

    this.#organizationRolesStore
      .removeMember(organizationId, member.userId)
      .pipe(
        finalize(() => {
          const nextMap = { ...this.memberUpdating() };
          delete nextMap[member.userId];
          this.memberUpdating.set(nextMap);
        }),
      )
      .subscribe({
        next: () => {
          this.orgMessage.set({
            kind: 'success',
            text: 'Membre retiré de l’organisation.',
          });
        },
        error: (error) => {
          this.orgMessage.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  roleLabel(role: OrganizationRoleView): string {
    return role.isSystem ? `${role.name} (Système)` : `${role.name} (Custom)`;
  }

  roleAssignableOptions(): Array<{ value: string; label: string }> {
    const customRoles = this.roles().map((role) => ({
      value: `custom:${role.id}`,
      label: `${role.name}${role.isSystem ? ' (Système)' : ''}`,
    }));
    return [...BUILT_IN_ROLES, ...customRoles];
  }

  private resolveAssignmentValue(value: string | null | undefined): {
    role?: string;
    organizationRoleId?: string | null;
  } {
    if (!value) {
      return {};
    }

    if (value.startsWith('role:')) {
      return { role: value.replace('role:', '') };
    }

    if (value.startsWith('custom:')) {
      return { organizationRoleId: value.replace('custom:', '') };
    }

    return {};
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

