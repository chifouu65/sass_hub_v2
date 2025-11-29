import { ComponentRef } from '@angular/core';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';

export class ModalRef<TComponent = unknown, TResult = unknown> {
  componentRef!: ComponentRef<TComponent>;

   readonly #closed$ = new Subject<TResult | undefined>();
   readonly #afterOpened$ = new ReplaySubject<void>(1);
   #onDestroyFn: (() => void) | null = null;
   #outputSub?: Subscription;

  afterClosed(): Observable<TResult | undefined> {
    return this.#closed$.asObservable();
  }

  afterOpened(): Observable<void> {
    return this.#afterOpened$.asObservable();
  }

  componentInstance(): TComponent {
    return this.componentRef.instance;
  }

  close(result?: TResult): void {
    if (!this.#closed$.closed) {
      this.#closed$.next(result);
      this.#closed$.complete();
    }

    this.#outputSub?.unsubscribe();
    this.#onDestroyFn?.();
    this.#onDestroyFn = null;
  }

  /** @internal */
  _setComponentRef(componentRef: ComponentRef<TComponent>): void {
    this.componentRef = componentRef;
  }

  /** @internal */
  _notifyOpened(): void {
    this.#afterOpened$.next();
  }

  /** @internal */
  _registerOnDestroy(fn: () => void): void {
    this.#onDestroyFn = fn;
  }

  /** @internal */
  _registerOutputs(sub: Subscription | undefined): void {
    this.#outputSub = sub;
  }
}

