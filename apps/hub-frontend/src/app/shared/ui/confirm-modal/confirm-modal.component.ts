import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  output,
} from '@angular/core';
import { ModalRef } from '../../modal/modal-ref';
import { MODAL_DATA } from '../../modal/modal.tokens';

export interface ConfirmModalData {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  standalone: true,
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="space-y-2">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {{ description() }}
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          (click)="cancelEvent.emit()"
        >
          {{ cancelLabel() }}
        </button>

        <button
          type="button"
          class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400"
          (click)="confirmEvent.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {

  readonly description = model<string>('Voulez-vous continuer ?');
  readonly confirmLabel = model<string>('Confirmer');
  readonly cancelLabel = model<string>('Annuler');

  readonly cancelEvent = output<void>();
  readonly confirmEvent = output<void>();

  readonly #modalRef = inject(ModalRef<ConfirmModalComponent, boolean>);
  readonly #data = inject<ConfirmModalData>(MODAL_DATA);

  constructor() {
    if (this.#data) {
      this.description.set(this.#data.description ?? this.description());
      this.confirmLabel.set(this.#data.confirmLabel ?? this.confirmLabel());
      this.cancelLabel.set(this.#data.cancelLabel ?? this.cancelLabel());
    }

    this.confirmEvent.subscribe(() => this.#modalRef.close(true));
    this.cancelEvent.subscribe(() => this.#modalRef.close(false));
  }
}

