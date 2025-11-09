import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  output,
} from '@angular/core';
import { ModalRef } from '../../services/modal/modal-ref';
import { MODAL_DATA } from '../../services/modal/modal.tokens';

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
        <p class="text-sm text-slate-600">
          {{ description() }}
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="cancelEvent.emit()"
        >
          {{ cancelLabel() }}
        </button>

        <button
          type="button"
          class="btn btn-danger"
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

