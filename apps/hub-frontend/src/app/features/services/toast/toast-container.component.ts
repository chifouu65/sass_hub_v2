import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ToastService } from './toast.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="flex flex-col items-start gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast [toast]="toast" (dismiss)="toastService.dismiss($event)"></app-toast>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed bottom-6 left-0 right-0 z-[1050] pointer-events-none flex justify-start px-4 sm:px-6'
  }
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}

