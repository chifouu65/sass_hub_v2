import {
  ChangeDetectionStrategy,
  Component,
  EnvironmentInjector,
  HostListener,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ModalRef } from './modal-ref';

export interface ModalHostOptions {
  title?: string | null;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

@Component({
  selector: 'lib-modal-host',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center sm:px-4 sm:py-8 transition-opacity duration-300 ease-out"
      [class.opacity-0]="!visible()"
      [class.opacity-100]="visible()"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out"
        [class.opacity-0]="!visible()"
        [class.opacity-100]="visible()"
        role="button"
        tabindex="0"
        aria-label="Fermer la modale"
        (click)="handleBackdrop()"
        (keydown.enter)="handleBackdrop()"
        (keydown.space)="handleBackdrop()"
      ></div>

      <!-- Panel -->
      <div
        class="relative mx-auto w-full h-full sm:h-auto max-w-none sm:max-w-2xl flex flex-col overflow-hidden bg-white shadow-xl ring-1 ring-slate-200 rounded-none sm:rounded-2xl transition-all duration-300 ease-out transform"
        [class.opacity-0]="!visible()"
        [class.scale-95]="!visible()"
        [class.translate-y-4]="!visible()"
        [class.opacity-100]="visible()"
        [class.scale-100]="visible()"
        [class.translate-y-0]="visible()"
      >
        <div
          class="flex items-start justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0"
        >
          <ng-container *ngIf="title as currentTitle">
            <h3 class="text-lg font-semibold text-slate-900">
              {{ currentTitle }}
            </h3>
          </ng-container>

          <button
            *ngIf="showCloseButton"
            type="button"
            class="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
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

        <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:max-h-[80vh]">
          <ng-template #contentHost></ng-template>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalHostComponent implements OnInit, OnDestroy {
  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  private readonly contentHost!: ViewContainerRef;

  title: string | null = null;
  showCloseButton = true;
  closeOnBackdrop = true;

  readonly visible = signal(false);

  #document = inject(DOCUMENT);
  #envInjector = inject(EnvironmentInjector);
  #modalRef = inject(ModalRef);

  constructor() {
    this.#disableScroll();
  }

  ngOnInit() {
    // Trigger enter animation
    setTimeout(() => this.visible.set(true), 50);
  }

  async animateClose(): Promise<void> {
    this.visible.set(false);
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

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

