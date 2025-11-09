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
  standalone: true,
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
          <svg
            *ngSwitchCase="'success'"
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"
            />
          </svg>
          <svg
            *ngSwitchCase="'error'"
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"
            />
          </svg>
          <svg
            *ngSwitchCase="'warning'"
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"
            />
          </svg>
          <svg
            *ngSwitchDefault
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M18 10A8 8 0 1 1 10 2a8 8 0 0 1 8 8ZM9 5.75a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm2 8.5V9H9v5.25a1 1 0 1 0 2 0Z"
            />
          </svg>
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
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
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

