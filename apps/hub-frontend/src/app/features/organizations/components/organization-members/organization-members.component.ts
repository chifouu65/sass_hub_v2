import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  OrganizationMemberView,
  OrganizationRolesStore,
} from '../../../../core/services/organization-roles';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton';
import {
  GenericTableComponent,
  GenericTableHeader,
} from '../../../../shared/ui/table/generic-table.component';
import { ModalService } from '../../../../shared/modal/modal.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

type AssignmentValue = string;

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    SkeletonComponent,
    GenericTableComponent,
  ],
  templateUrl: './organization-members.component.html',
})
export class OrganizationMembersComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesStore);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #modalService = inject(ModalService);

  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly members = this.#organizationRolesStore.members;
  readonly membersLoading = this.#organizationRolesStore.membersLoading;
  readonly searchTerm = signal('');
  readonly showAddMemberForm = signal(false);
  readonly tableSkeletonRows = signal(4);
  readonly tableHeaders = signal<GenericTableHeader[]>([
    { key: 'member', label: 'Membre', align: 'left' },
    { key: 'role', label: 'Rôle assigné', align: 'left' },
    { key: 'since', label: 'Depuis', align: 'left' },
    { key: 'actions', label: 'Actions', align: 'right', srOnly: true },
  ]);
  readonly filteredMembers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.members();

    if (!term) {
      return list;
    }

    return list.filter((member) => {
      const haystack = [
        member.firstName ?? '',
        member.lastName ?? '',
        member.email ?? '',
        member.organizationRoleName ?? '',
        member.role ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });
  readonly paginationInfo = computed(() => {
    const filtered = this.filteredMembers();
    const total = filtered.length;
    const overall = this.members().length;

    return {
      start: total > 0 ? 1 : 0,
      end: total,
      total,
      overall,
    };
  });

  readonly addMemberForm = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
    assignment: ['', [Validators.required]],
  });

  readonly addMemberSubmitting = signal(false);
  readonly memberAssignments = signal<Record<string, AssignmentValue>>({});
  readonly memberUpdating = signal<Record<string, boolean>>({});
  readonly roleOptions = computed(() => {
    const roles = this.#organizationRolesStore.roles();
    return roles.map((role) => ({
      value: `custom:${role.id}`,
      label: `${role.name}${role.isSystem ? ' (Système)' : ''}`,
    }));
  });
  readonly message = signal<{ text: string; kind: 'success' | 'error' } | null>(
    null
  );

  constructor() {
    effect(
      () => {
        const assignments = this.members().reduce((acc, member) => {
          acc[member.userId] = member.organizationRoleId ?? '';
          return acc;
        }, {} as Record<string, AssignmentValue>);
        this.memberAssignments.set(assignments);
      },
      { allowSignalWrites: true }
    );
  }

  onAssignmentChange(userId: string, value: string): void {
    const current = { ...this.memberAssignments() };
    current[userId] = value;
    this.memberAssignments.set(current);
  }

  async onAddMember(): Promise<void> {
    this.message.set(null);
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.message.set({
        kind: 'error',
        text: 'Veuillez sélectionner une organisation.',
      });
      return;
    }

    const { email, assignment } = this.addMemberForm.getRawValue();
    const payload = this.#resolveAssignmentValue(assignment);

    const confirmed = await this.#confirmAction(
      {
        description: `Confirmez l’ajout de ${email.trim()} à cette organisation.`,
        confirmLabel: 'Ajouter',
        cancelLabel: 'Annuler',
      },
      'Ajouter un membre'
    );

    if (!confirmed) {
      return;
    }

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
          this.message.set({
            kind: 'success',
            text: 'Utilisateur ajouté à l’organisation.',
          });
          this.showAddMemberForm.set(false);
          this.addMemberForm.reset({
            email: '',
            assignment: '',
          });
        },
        error: (error) => {
          this.message.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  async updateMemberAssignment(member: OrganizationMemberView): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const assignment = this.memberAssignments()[member.userId];
    if (!assignment) {
      return;
    }

    const payload = this.#resolveAssignmentValue(assignment);
    const confirmed = await this.#confirmAction(
      {
        description: `Confirmez la mise à jour du rôle de ${member.email}.`,
        confirmLabel: 'Mettre à jour',
        cancelLabel: 'Annuler',
      },
      'Modifier un membre'
    );

    if (!confirmed) {
      return;
    }

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
        })
      )
      .subscribe({
        next: () => {
          this.message.set({
            kind: 'success',
            text: 'Rôle du membre mis à jour.',
          });
        },
        error: (error) => {
          this.message.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  async removeMember(member: OrganizationMemberView): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const confirmed = await this.#confirmAction(
      {
        description: `Retirer ${member.email} de cette organisation ?`,
        confirmLabel: 'Retirer',
        cancelLabel: 'Annuler',
      },
      'Retirer un membre'
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
        })
      )
      .subscribe({
        next: () => {
          this.message.set({
            kind: 'success',
            text: 'Membre retiré de l’organisation.',
          });
        },
        error: (error) => {
          this.message.set({
            kind: 'error',
            text: this.#extractErrorMessage(error),
          });
        },
      });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
  }

  resetSearch(): void {
    if (this.searchTerm()) {
      this.searchTerm.set('');
    }
  }

  toggleAddMemberForm(): void {
    this.showAddMemberForm.update((value) => {
      const next = !value;
      if (!next) {
        this.addMemberForm.reset({
          email: '',
          assignment: '',
        });
      }
      return next;
    });
  }

  isMemberUpdating(member: OrganizationMemberView): boolean {
    return this.memberUpdating()[member.userId] ?? false;
  }

  trackMember(_: number, member: OrganizationMemberView): string {
    return member.userId;
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

  #resolveAssignmentValue(value: string | null | undefined): {
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
