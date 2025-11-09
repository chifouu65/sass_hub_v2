import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { OrganizationRolesStore } from '../../../../core/services/organization-roles';
import { ModalService } from '../../../../shared/modal/modal.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../../../../shared/ui/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-organization-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-details.component.html',
})
export class OrganizationDetailsComponent {
  private readonly organizationRolesStore = inject(OrganizationRolesStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modalService = inject(ModalService);

  readonly selectedOrganizationId =
    this.organizationRolesStore.selectedOrganizationId;

  readonly updateOrganizationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    databaseName: [''],
  });

  readonly updateSubmitting = signal(false);
  readonly deleteSubmitting = signal(false);
  readonly message = signal<{ text: string; kind: 'success' | 'error' } | null>(
    null
  );

  private readonly slugManuallyEditedUpdate = signal(false);

  constructor() {
    effect(
      () => {
        const organizations = this.organizationRolesStore.organizations();
        const selectedId = this.selectedOrganizationId();
        const selected =
          organizations.find(
            (organization) => organization.id === selectedId
          ) ?? null;

        if (selected) {
          this.updateOrganizationForm.setValue({
            name: selected.name ?? '',
            slug: selected.slug ?? '',
            databaseName: selected.databaseName ?? '',
          });
          this.slugManuallyEditedUpdate.set(true);
        } else {
          this.updateOrganizationForm.reset({
            name: '',
            slug: '',
            databaseName: '',
          });
          this.slugManuallyEditedUpdate.set(false);
        }
      },
      { allowSignalWrites: true }
    );
  }

  onNameInput(): void {
    if (this.slugManuallyEditedUpdate()) {
      return;
    }
    const name = this.updateOrganizationForm.controls.name.value;
    this.updateOrganizationForm.controls.slug.setValue(this.slugify(name));
  }

  onSlugInput(): void {
    this.slugManuallyEditedUpdate.set(true);
    const value = this.updateOrganizationForm.controls.slug.value;
    this.updateOrganizationForm.controls.slug.setValue(this.slugify(value));
  }

  async onSubmit(): Promise<void> {
    this.message.set(null);
    if (this.updateOrganizationForm.invalid) {
      this.updateOrganizationForm.markAllAsTouched();
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

    const { name, slug, databaseName } =
      this.updateOrganizationForm.getRawValue();

    const confirmed = await this.confirmAction(
      {
        description: `Les informations de "${name.trim()}" seront modifiées.`,
        confirmLabel: 'Mettre à jour',
        cancelLabel: 'Annuler',
      },
      'Modifier une organisation'
    );

    if (!confirmed) {
      return;
    }

    this.updateSubmitting.set(true);
    this.organizationRolesStore
      .updateOrganization(organizationId, {
        name: name.trim(),
        slug: slug.trim(),
        databaseName: databaseName?.trim() || undefined,
      })
      .pipe(finalize(() => this.updateSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.message.set({
            kind: 'success',
            text: 'Organisation mise à jour.',
          });
        },
        error: (error) => {
          this.message.set({
            kind: 'error',
            text: this.extractErrorMessage(error),
          });
        },
      });
  }

  async onDelete(): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return;
    }

    const org = this.organizationRolesStore
      .organizations()
      .find((item) => item.id === organizationId);

    const confirmed = await this.confirmAction(
      {
        description: org
          ? `Cette action supprimera définitivement "${org.name}".`
          : 'Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
      },
      'Supprimer une organisation'
    );

    if (!confirmed) {
      return;
    }

    this.deleteSubmitting.set(true);
    this.organizationRolesStore
      .deleteOrganization(organizationId)
      .pipe(finalize(() => this.deleteSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.message.set({
            kind: 'success',
            text: 'Organisation supprimée.',
          });
        },
        error: (error) => {
          this.message.set({
            kind: 'error',
            text: this.extractErrorMessage(error),
          });
        },
      });
  }

  private async confirmAction(
    data: ConfirmModalData,
    hostTitle: string
  ): Promise<boolean> {
    const modalRef = this.modalService.open<ConfirmModalComponent, boolean>(
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private extractErrorMessage(error: unknown): string {
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
