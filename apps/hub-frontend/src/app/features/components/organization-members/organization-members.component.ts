import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationMemberView } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { SkeletonComponent } from '../skeleton/skeleton';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { GenericTableHeader } from '../generic-table/generic-table.component';
import { OrganizationMemberRoleModalComponent, OrganizationMemberRoleModalData } from './organization-member-role-modal.component';
import { OrganizationMemberCreateModalComponent, OrganizationMemberCreateModalResult } from './organization-member-create-modal.component';
import { ModalService, ConfirmModalComponent, ConfirmModalData } from '@sass-hub-v2/ui-kit';
import { ToastService } from '../../services/toast/toast.service';
import { finalize, firstValueFrom } from 'rxjs';

type AssignmentValue = string;

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SkeletonComponent,
    GenericTableComponent,
  ],
  templateUrl: './organization-members.component.html',
})
export class OrganizationMembersComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #modalService = inject(ModalService);
  readonly #toastService = inject(ToastService);

  readonly organizations = this.#organizationRolesStore.organizations;
  readonly selectedOrganizationId =
    this.#organizationRolesStore.selectedOrganizationId;
  readonly members = this.#organizationRolesStore.members;
  readonly membersLoading = this.#organizationRolesStore.membersLoading;
  readonly searchTerm = signal('');
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
          this.#toastService.success('Rôle du membre mis à jour.');
        },
        error: (error) => {
          this.#toastService.error(this.#extractErrorMessage(error));
        },
      });
  }

  async openAddMemberModal(): Promise<void> {
    const options = this.roleOptions();

    if (!options.length) {
      this.#toastService.error('Aucun rôle disponible pour ajouter un membre.');
      return;
    }

    const modalRef =
      this.#modalService.open<
        OrganizationMemberCreateModalComponent,
        OrganizationMemberCreateModalResult | undefined
      >(OrganizationMemberCreateModalComponent, {
        data: {
          options,
        },
        host: {
          title: 'Ajouter un membre à l’organisation',
        },
      });

    const result = await firstValueFrom(modalRef.afterClosed());

    if (!result) {
      return;
    }

    await this.#addMember(result.email, result.assignment);
  }

  async openUpdateRoleModal(
    member: OrganizationMemberView
  ): Promise<void> {
    const options = this.roleOptions();
    if (!options.length) {
      this.#toastService.error('Aucun rôle disponible pour cette organisation.');
      return;
    }

    const currentAssignment = this.memberAssignments()[member.userId] ?? '';
    const modalRef =
      this.#modalService.open<
        OrganizationMemberRoleModalComponent,
        string | undefined
      >(OrganizationMemberRoleModalComponent, {
        data: {
          memberLabel:
            `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() ||
            member.email,
          memberEmail: member.email,
          currentRoleLabel: member.organizationRoleName ?? member.role ?? null,
          currentAssignment,
          options,
        } satisfies OrganizationMemberRoleModalData,
        host: {
          title: 'Modifier le rôle du membre',
        },
      });

    const selection = await firstValueFrom(modalRef.afterClosed());

    if (selection === undefined || selection === currentAssignment) {
      return;
    }

    this.onAssignmentChange(member.userId, selection);
    await this.updateMemberAssignment(member);
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
          this.#toastService.success('Membre retiré de l’organisation.');
        },
        error: (error) => {
          this.#toastService.error(this.#extractErrorMessage(error));
        },
      });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
  }

  onOrganizationSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.#organizationRolesStore.selectOrganization(value);
    }
  }

  isMemberUpdating(member: OrganizationMemberView): boolean {
    return this.memberUpdating()[member.userId] ?? false;
  }

  trackMember(_: number, member: OrganizationMemberView): string {
    return member.userId;
  }

  onRefresh(): void {
    const organizationId = this.selectedOrganizationId();
    if (organizationId) {
      this.#organizationRolesStore.reloadMembers(organizationId);
    }
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

  async #addMember(email: string, assignment: string): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      this.#toastService.error('Veuillez sélectionner une organisation.');
      return;
    }

    const payload = this.#resolveAssignmentValue(assignment);

    this.addMemberSubmitting.set(true);

    try {
      await firstValueFrom(
        this.#organizationRolesStore.addMember(organizationId, {
          email: email.trim(),
          role: payload.role ?? undefined,
          organizationRoleId: payload.organizationRoleId ?? undefined,
        })
      );

      this.#toastService.success('Utilisateur ajouté à l’organisation.');
    } catch (error) {
      this.#toastService.error(this.#extractErrorMessage(error));
    } finally {
      this.addMemberSubmitting.set(false);
    }
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
