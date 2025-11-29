import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { ModalRef } from '@sass-hub-v2/ui-kit';
import { MODAL_DATA } from '@sass-hub-v2/ui-kit';

type PermissionDetail = {
  code: string;
  label: string;
  description: string;
};

export interface OrganizationRolePermissionsModalData {
  roleName: string;
  permissions: PermissionDetail[];
}

@Component({
  standalone: true,
  selector: 'app-organization-role-permissions-modal',
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-slate-900">
          {{ data().roleName }}
        </h3>
        <p class="text-sm text-slate-500">
          Détails des permissions attribuées à ce rôle.
        </p>
      </div>

      <div
        class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
      >
        {{ data().permissions.length }} permission{{ data().permissions.length > 1 ? 's' : '' }}
        assignée{{ data().permissions.length > 1 ? 's' : '' }}.
      </div>

      <ul class="space-y-3">
        @for (permission of data().permissions; track permission.code) {
          <li class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-slate-900">
                  {{ permission.label }}
                </span>
                <span
                  class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600"
                >
                  {{ permission.code }}
                </span>
              </div>
              <p class="text-xs text-slate-500">
                {{ permission.description }}
              </p>
            </div>
          </li>
        }
      </ul>

      <div class="flex justify-end">
        <button type="button" class="btn btn-secondary btn-sm" (click)="close()">
          Fermer
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationRolePermissionsModalComponent {
  readonly #modalRef =
    inject<ModalRef<OrganizationRolePermissionsModalComponent, void>>(ModalRef);
  readonly #data = inject<OrganizationRolePermissionsModalData>(MODAL_DATA);

  readonly data: Signal<OrganizationRolePermissionsModalData> =
    signal(this.#data);

  close(): void {
    this.#modalRef.close();
  }
}

