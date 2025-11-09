import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AvailableApplicationView } from '@sass-hub-v2/shared-types';
import { OrganizationRolesService } from '../../../core/services/organization-roles.service';
import { ToastService } from '../../services/toast/toast.service';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';

export interface OrganizationApplicationSubscribeModalData {
  organizationId: string;
}

export interface OrganizationApplicationSubscribeModalResult {
  applicationId: string;
}

@Component({
  standalone: true,
  selector: 'app-organization-application-subscribe-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700" for="application-select">
          Application à installer
        </label>

        @if (loading()) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chargement des applications disponibles…
          </div>
        } @else if (!availableApplications().length) {
          <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Aucune application disponible à l’installation pour cette organisation.
          </div>
        } @else {
          <select
            id="application-select"
            class="form-select w-full"
            formControlName="applicationId"
          >
            <option value="" disabled>Choisissez une application</option>
            @for (app of availableApplications(); track app.id) {
              <option [value]="app.id">
                {{ app.name }} — {{ app.status | titlecase }}
              </option>
            }
          </select>
          @if (form.controls.applicationId.invalid && form.controls.applicationId.touched) {
            <p class="text-xs text-red-600">
              Sélectionnez une application.
            </p>
          }
        }
      </div>

      @if (selectedApplication(); as app) {
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-900">{{ app.name }}</span>
            <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {{ app.status | titlecase }}
            </span>
          </div>
          @if (app.description) {
            <p>{{ app.description }}</p>
          }
          @if (app.category) {
            <p class="text-xs text-slate-500">
              Catégorie : {{ app.category }}
            </p>
          }
        </div>
      }

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-secondary" (click)="close()">
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || submitting() || !availableApplications().length"
        >
          @if (submitting()) {
            <svg
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          }
          Installer
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationApplicationSubscribeModalComponent implements OnInit {
  readonly #data = inject<OrganizationApplicationSubscribeModalData>(MODAL_DATA);
  readonly #organizationStore = inject(OrganizationRolesService);
  readonly #toastService = inject(ToastService);
  readonly #modalRef =
    inject<ModalRef<OrganizationApplicationSubscribeModalComponent, OrganizationApplicationSubscribeModalResult | undefined>>(
      ModalRef,
    );
  readonly #fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly available = signal<AvailableApplicationView[]>([]);

  readonly form = this.#fb.group({
    applicationId: this.#fb.control<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  readonly availableApplications = this.available.asReadonly();
  readonly selectedApplication = computed(() => {
    const id = this.form.controls.applicationId.value;
    return this.availableApplications().find((app) => app.id === id) ?? null;
  });

  ngOnInit(): void {
    this.#loadAvailableApplications();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const applicationId = this.form.controls.applicationId.value;
    if (!applicationId) {
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.#organizationStore.subscribeToApplication(this.#data.organizationId, applicationId),
      );
      this.close({ applicationId });
    } catch (error) {
      this.#toastService.error(this.#extractErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  close(result?: OrganizationApplicationSubscribeModalResult): void {
    this.#modalRef.close(result);
  }

   async #loadAvailableApplications(): Promise<void> {
    this.loading.set(true);
    try {
      const apps = await firstValueFrom(
        this.#organizationStore.fetchAvailableApplications(this.#data.organizationId),
      );
      this.available.set(apps);
      if (apps.length === 1) {
        this.form.controls.applicationId.setValue(apps[0].id);
      }
    } catch (error) {
      this.#toastService.error(this.#extractErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
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

