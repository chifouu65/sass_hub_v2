export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  readonly kind?: ToastKind;
  readonly autoClose?: boolean;
  readonly duration?: number;
  readonly dismissible?: boolean;
}

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly kind: ToastKind;
  readonly dismissible: boolean;
  readonly createdAt: number;
  readonly autoClose: boolean;
  readonly duration: number;
}

