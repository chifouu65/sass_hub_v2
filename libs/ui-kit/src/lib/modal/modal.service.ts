import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Type,
  createComponent,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EventEmitter, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { ModalHostComponent, ModalHostOptions } from './modal-host.component';
import { ModalRef } from './modal-ref';
import { MODAL_DATA } from './modal.tokens';

export interface ModalOptions<TComponent extends object> {
  componentInputs?: Partial<TComponent>;
  componentOutputs?: {
    [K in keyof TComponent]?: TComponent[K] extends EventEmitter<infer R>
      ? (value: R) => void
      : never;
  };
  data?: unknown;
  host?: ModalHostOptions;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly #document = inject(DOCUMENT);

  readonly #appRef = inject(ApplicationRef);
  readonly #injector = inject(Injector);
  readonly #environmentInjector = inject(EnvironmentInjector);

  open<TComponent extends object, TResult = unknown>(
    componentType: Type<TComponent>,
    options: ModalOptions<TComponent> = {}
  ): ModalRef<TComponent, TResult> {
    const container = this.#document.createElement('div');
    this.#document.body.appendChild(container);

    const modalRef = new ModalRef<TComponent, TResult>();

    const modalInjector = Injector.create({
      parent: this.#injector,
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: MODAL_DATA, useValue: options.data },
      ],
    });

    const hostComponentRef = createComponent(ModalHostComponent, {
      hostElement: container,
      environmentInjector: this.#environmentInjector,
      elementInjector: modalInjector,
    });

    this.#appRef.attachView(hostComponentRef.hostView);

    const componentRef = hostComponentRef.instance.attachComponent(
      componentType,
      {
        title: options.host?.title ?? null,
        showCloseButton: options.host?.showCloseButton ?? true,
        closeOnBackdrop: options.host?.closeOnBackdrop ?? true,
      },
      modalInjector
    ) as ComponentRef<TComponent>;

    modalRef._setComponentRef(componentRef);

    if (options.componentInputs) {
      Object.assign(componentRef.instance as object, options.componentInputs);
    }

    let outputsSub: Subscription | undefined;

    if (options.componentOutputs) {
      outputsSub = new Subscription();
      for (const [key, handler] of Object.entries(options.componentOutputs)) {
        const outputCandidate = (
          componentRef.instance as Record<string, unknown>
        )[key];
        if (
          outputCandidate instanceof EventEmitter &&
          typeof handler === 'function'
        ) {
          outputsSub.add(outputCandidate.subscribe(handler));
        }
      }
    }

    modalRef._registerOutputs(outputsSub);
    modalRef._registerOnDestroy(async () => {
      await hostComponentRef.instance.animateClose();
      
      outputsSub?.unsubscribe();
      componentRef.destroy();
      this.#appRef.detachView(hostComponentRef.hostView);
      hostComponentRef.destroy();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    modalRef._notifyOpened();

    return modalRef;
  }
}

