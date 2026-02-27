import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ErrorMessageService } from '../../../core/services/error-message.service';
import { slugify } from '@sass-hub-v2/utils';
import { ModalService, ConfirmModalComponent, ConfirmModalData } from '@sass-hub-v2/ui-kit';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-organization-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-create-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCreateModalComponent {
  readonly #organizationRolesStore = inject(OrganizationRolesService);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #modalService = inject(ModalService);
  readonly #toastService = inject(ToastService);
  readonly #errorMessage = inject(ErrorMessageService);

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
    try {
      await firstValueFrom(
        this.#organizationRolesStore.createOrganization({
          name: name.trim(),
          slug: slug.trim(),
          databaseName: databaseName?.trim() || undefined,
        }),
      );
      this.#toastService.success('Organisation créée avec succès.');
      this.#slugManuallyEditedCreate.set(false);
    } catch (error) {
      this.#toastService.error(this.#errorMessage.getMessage(error));
    } finally {
      this.createSubmitting.set(false);
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

}
