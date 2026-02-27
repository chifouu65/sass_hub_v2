import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EffectRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrganizationSummary } from '@sass-hub-v2/shared-types';
import { slugify } from '@sass-hub-v2/utils';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ErrorMessageService } from '../../../core/services/error-message.service';
import { ModalRef } from '@sass-hub-v2/ui-kit';
import { MODAL_DATA } from '@sass-hub-v2/ui-kit';
import { ToastService } from '../../services/toast/toast.service';

export interface OrganizationManageModalData {
  mode: 'create' | 'update';
  organization?: OrganizationSummary;
}

@Component({
  selector: 'app-organization-manage-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="space-y-2">
        <label
          class="block text-sm font-medium text-slate-700"
          for="organization-name"
        >
          Nom de l’organisation
        </label>
        <input
          id="organization-name"
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
        <label
          class="block text-sm font-medium text-slate-700"
          for="organization-slug"
        >
          Slug
        </label>
        <input
          id="organization-slug"
          type="text"
          class="form-input"
          formControlName="slug"
          (input)="onSlugInput()"
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
          for="organization-db"
        >
          Base de données (optionnel)
        </label>
        <input
          id="organization-db"
          type="text"
          class="form-input"
          formControlName="databaseName"
          autocomplete="off"
        />
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="close(false)"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || submitting()"
        >
          @if (submitting()) {
            <i class="mdi mdi-loading mdi-spin text-sm"></i>
          }
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationManageModalComponent {
  readonly #data = inject<OrganizationManageModalData>(MODAL_DATA);
  readonly #modalRef =
    inject<ModalRef<OrganizationManageModalComponent, boolean>>(ModalRef);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #store = inject(OrganizationRolesService);
  readonly #toast = inject(ToastService);
  readonly #errorMessage = inject(ErrorMessageService);

  readonly form = this.#fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    databaseName: [''],
  });

  readonly submitting = signal(false);
  readonly submitLabel = computed(() =>
    this.#data.mode === 'create' ? 'Créer' : 'Mettre à jour'
  );
  readonly #shouldResetForm = computed(
    () => !this.submitting() && this.#data.mode === 'create'
  );

  readonly #slugManuallyEdited = linkedSignal({
    source: this.#shouldResetForm,
    computation: (shouldReset, previous) =>
      shouldReset ? false : (previous?.value ?? false),
  });
  readonly #cleanupEffect: EffectRef;

  constructor() {
    const organization = this.#data.organization;

    if (organization) {
      this.form.setValue({
        name: organization.name,
        slug: organization.slug,
        databaseName: organization.databaseName ?? '',
      });
    }

    this.#cleanupEffect = effect(() => {
      if (this.#shouldResetForm()) {
        this.form.reset(
          {
            name: '',
            slug: '',
            databaseName: '',
          },
          { emitEvent: false }
        );
      }
    });
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
    const slugValue = this.form.controls.slug.value;
    this.form.controls.slug.setValue(slugify(slugValue));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, slug, databaseName } = this.form.getRawValue();
    this.submitting.set(true);

    try {
      if (this.#data.mode === 'create') {
        await firstValueFrom(
          this.#store.createOrganization({
            name: name.trim(),
            slug: slug.trim(),
            databaseName: databaseName?.trim() || undefined,
          })
        );
        this.#toast.success('Organisation créée avec succès.');
      } else if (this.#data.organization) {
        await firstValueFrom(
          this.#store.updateOrganization(this.#data.organization.id, {
            name: name.trim(),
            slug: slug.trim(),
            databaseName: databaseName?.trim() || undefined,
          })
        );
        this.#toast.success('Organisation mise à jour.');
      }

      this.close(true);
    } catch (error) {
      this.#toast.error(this.#errorMessage.getMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  close(result: boolean): void {
    this.#cleanupEffect.destroy();
    this.#modalRef.close(result);
  }

}

