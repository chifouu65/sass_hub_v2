import {
  ChangeDetectionStrategy,
  Component,
  EnvironmentInjector,
  HostListener,
  inject,
  Inject,
  Injector,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ModalRef } from './modal-ref';

export interface ModalHostOptions {
  title?: string | null;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-modal-host',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        role="button"
        tabindex="0"
        aria-label="Fermer la modale"
        (click)="handleBackdrop()"
        (keydown.enter)="handleBackdrop()"
        (keydown.space)="handleBackdrop()"
      ></div>

      <div
        class="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
      >
        <div
          class="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800"
        >
          <ng-container *ngIf="title as currentTitle">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ currentTitle }}
            </h3>
          </ng-container>

          <button
            *ngIf="showCloseButton"
            type="button"
            class="ml-4 inline-flex shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            (click)="close()"
            aria-label="Fermer"
          >
            <svg
              aria-hidden="true"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
        </div>

        <div class="max-h-[80vh] overflow-y-auto px-6 py-5">
          <ng-template #contentHost></ng-template>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalHostComponent implements OnDestroy {
  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  private readonly contentHost!: ViewContainerRef;

  title: string | null = null;
  showCloseButton = true;
  closeOnBackdrop = true;

  constructor(
  ) {
    this.#disableScroll();
  }

  #document = inject(DOCUMENT);
  #envInjector = inject(EnvironmentInjector);
  #modalRef = inject(ModalRef);

  attachComponent<T>(
    componentType: Type<T>,
    options: ModalHostOptions,
  componentInjector: Injector,
  ): ViewContainerRef['createComponent'] extends (...args: infer P) => infer R
    ? R
    : never {
    this.title = options.title ?? null;
    this.showCloseButton = options.showCloseButton ?? true;
    this.closeOnBackdrop = options.closeOnBackdrop ?? true;

    this.contentHost.clear();

    const componentRef = this.contentHost.createComponent(componentType, {
      injector: componentInjector,
      environmentInjector: this.#envInjector,
    });

    this.#modalRef._setComponentRef(componentRef as any);

    return componentRef as any;
  }

  close(): void {
    this.#modalRef.close();
  }

  handleBackdrop(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.close();
  }

  ngOnDestroy(): void {
    this.#restoreScroll();
    this.contentHost.clear();
  }

   #disableScroll(): void {
    this.#document.body.style.overflow = 'hidden';
  }

  #restoreScroll(): void {
    this.#document.body.style.overflow = '';
  }
}

