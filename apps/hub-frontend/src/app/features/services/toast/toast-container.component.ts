import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
} from '@angular/core';
import { ToastService } from './toast.service';
import { ToastComponent } from './toast.component';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="flex flex-col items-end gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast [toast]="toast" (dismiss)="toastService.dismiss($event)"></app-toast>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  @HostBinding('class')
  protected get hostClass(): string {
    return 'fixed inset-x-0 top-6 z-[1050] pointer-events-none flex justify-end px-4 sm:px-6';
  }
}

