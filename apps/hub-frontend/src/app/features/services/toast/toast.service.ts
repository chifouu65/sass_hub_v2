import { Injectable, computed, effect, signal } from '@angular/core';
import { Toast, ToastConfig, ToastKind } from './toast.types';

const DEFAULT_DURATION = 4_000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly #toasts = signal<Toast[]>([]);
  readonly toasts = computed(() => this.#toasts());

  readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const current = this.#toasts();
      const activeIds = new Set(current.map((toast) => toast.id));
      for (const [id, timer] of this.#timers.entries()) {
        if (!activeIds.has(id)) {
          clearTimeout(timer);
          this.#timers.delete(id);
        }
      }
    });
  }

  success(message: string, config?: ToastConfig): string {
    console.log('success toast', message, config);
    return this.show(message, { ...config, kind: 'success' });
  }

  error(message: string, config?: ToastConfig): string {
    console.log('error toast', message, config);
    return this.show(message, { ...config, kind: 'error' });
  }

  warning(message: string, config?: ToastConfig): string {
    return this.show(message, { ...config, kind: 'warning' });
  }

  info(message: string, config?: ToastConfig): string {
    return this.show(message, { ...config, kind: 'info' });
  }

  show(message: string, config: ToastConfig = {}): string {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const kind: ToastKind = config.kind ?? 'info';
    const dismissible = config.dismissible ?? true;
    const autoClose = config.autoClose ?? true;
    const duration = config.duration ?? DEFAULT_DURATION;

    const toast: Toast = {
      id,
      message,
      kind,
      dismissible,
      createdAt: Date.now(),
      autoClose,
      duration,
    };

    this.#toasts.update((toasts) => [toast, ...toasts]);
    if (autoClose) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.#timers.set(id, timer);
    }

    return id;
  }

  dismiss(id: string): void {
    const timer = this.#timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }

    this.#toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const [, timer] of this.#timers.entries()) {
      clearTimeout(timer);
    }
    this.#timers.clear();
    this.#toasts.set([]);
  }
}

