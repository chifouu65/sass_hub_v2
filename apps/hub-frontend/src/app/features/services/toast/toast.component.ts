import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
} from '@angular/core';
import { Toast } from './toast.types';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center w-full max-w-xs p-4 text-sm text-gray-500 bg-white rounded-lg shadow-sm pointer-events-auto"
      role="alert"
      [attr.data-toast-id]="toast().id"
    >
      <div
        class="inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg"
        [ngClass]="iconWrapperClasses()"
      >
        <ng-container [ngSwitch]="toast().kind">
          <i
            *ngSwitchCase="'success'"
            class="mdi mdi-check-circle text-lg"
            aria-hidden="true"
          ></i>
          <i
            *ngSwitchCase="'error'"
            class="mdi mdi-close-circle text-lg"
            aria-hidden="true"
          ></i>
          <i
            *ngSwitchCase="'warning'"
            class="mdi mdi-alert-circle text-lg"
            aria-hidden="true"
          ></i>
          <i
            *ngSwitchDefault
            class="mdi mdi-information text-lg"
            aria-hidden="true"
          ></i>
        </ng-container>
        <span class="sr-only">{{ iconLabel() }}</span>
      </div>

      <div class="ms-3 flex-1 text-sm font-normal text-gray-700">
        {{ toast().message }}
      </div>

      @if (toast().dismissible) {
        <button
          type="button"
          class="btn btn-icon ms-auto -mx-1.5 -my-1.5"
          (click)="dismiss.emit(toast().id)"
          aria-label="Fermer"
        >
          <span class="sr-only">Fermer</span>
          <i class="mdi mdi-close text-sm" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toast = input.required<Toast>();

  readonly iconWrapperClasses = computed(() => {
    switch (this.toast().kind) {
      case 'success':
        return 'text-green-500 bg-green-100';
      case 'error':
        return 'text-red-500 bg-red-100';
      case 'warning':
        return 'text-orange-500 bg-orange-100';
      case 'info':
      default:
        return 'text-blue-500 bg-blue-100';
    }
  });

  readonly iconLabel = computed(() => {
    switch (this.toast().kind) {
      case 'success':
        return 'Icône succès';
      case 'error':
        return 'Icône erreur';
      case 'warning':
        return 'Icône avertissement';
      case 'info':
      default:
        return 'Icône information';
    }
  });

  @Output() readonly dismiss = new EventEmitter<string>();
}

