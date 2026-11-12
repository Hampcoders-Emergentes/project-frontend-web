import { Injectable, signal } from '@angular/core';

/** The tone of a toast; request errors stay inline notices, so toasts only confirm or inform. */
export type ToastTone = 'success' | 'info';

/** A transient confirmation shown by the shell. */
export interface Toast {
  readonly id: number;
  readonly tone: ToastTone;
  /** The translation key of the message. */
  readonly messageKey: string;
  readonly params: Readonly<Record<string, string>>;
}

const DISMISS_AFTER_MS = 6000;

/**
 * Queue of the toasts the private shell renders. A view shows one after a completed user action that
 * moves it elsewhere (for example, creating a store), so the confirmation survives the navigation.
 */
@Injectable({ providedIn: 'root' })
export class ToastCenter {
  private readonly toastsSignal = signal<readonly Toast[]>([]);
  private nextId = 1;

  readonly toasts = this.toastsSignal.asReadonly();

  show(messageKey: string, params: Readonly<Record<string, string>> = {}, tone: ToastTone = 'success'): void {
    const id = this.nextId++;
    this.toastsSignal.update((toasts) => [...toasts, { id, tone, messageKey, params }]);
    setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
