import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { slugify } from '@sass-hub-v2/utils';
import { ModalService } from '../../services/modal/modal.service';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-organization-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-create-modal.component.html',
})
export class OrganizationCreateModalComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #modalService = inject(ModalService);

  readonly createOrganizationForm = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    databaseName: [''],
  });

  readonly createSubmitting = signal(false);
  readonly formMessage = signal<{
    text: string;
    kind: 'success' | 'error';
  } | null>(null);

  readonly #slugManuallyEditedCreate = signal(false);

  constructor() {
    effect(
      () => {
        if (!this.createSubmitting()) {
          this.formMessage.set(null);
        }
      },
      { allowSignalWrites: true }
    );
  }

  onNameInput(): void {
    if (this.#slugManuallyEditedCreate()) {
      return;
    }
    const name = this.createOrganizationForm.controls.name.value;
    this.createOrganizationForm.controls.slug.setValue(slugify(name));
  }

  onSlugInput(): void {
    this.#slugManuallyEditedCreate.set(true);
    const value = this.createOrganizationForm.controls.slug.value;
    this.createOrganizationForm.controls.slug.setValue(slugify(value));
  }

  async onSubmit(): Promise<void> {
    this.formMessage.set(null);
    if (this.createOrganizationForm.invalid) {
      this.createOrganizationForm.markAllAsTouched();
      return;
    }

    const { name, slug, databaseName } =
      this.createOrganizationForm.getRawValue();

    const confirmed = await this.#confirmAction(
      {
        description: `Confirmez la création de "${name.trim()}" avec le slug "${slug.trim()}".`,
        confirmLabel: 'Créer',
        cancelLabel: 'Annuler',
      },
      'Créer une organisation'
    );

    if (!confirmed) {
      return;
    }

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
