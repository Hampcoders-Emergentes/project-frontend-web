import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';
import { ToastCenter } from '@shared/presentation/components/toast/toast-center';

/** Renders the queued toasts in a polite live region at the bottom of the viewport. */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-toast-host',
  styles: `
    .toast-host { position: fixed; inset-block-end: var(--space-3); inset-inline-end: var(--space-3); z-index: 50;
      display: grid; gap: var(--space-1); width: min(24rem, calc(100vw - 2 * var(--space-2))); margin: 0; padding: 0; list-style: none; }
    .toast { display: flex; align-items: flex-start; gap: var(--space-1); padding: 0.75rem 0.5rem 0.75rem var(--space-2);
      border: 1px solid currentColor; border-radius: var(--radius-card); background: var(--tone-success-bg);
      color: var(--tone-success-fg); box-shadow: 0 12px 32px rgb(15 23 42 / 0.18); animation: toast-in 200ms ease-out; }
    .toast--info { background: var(--tone-info-bg); color: var(--tone-info-fg); }
    .toast__icon { flex-shrink: 0; width: 1.25rem; height: 1.25rem; margin-block-start: 0.125rem; }
    .toast__text { flex: 1; margin: 0; color: var(--text-primary); font-weight: var(--font-weight-semibold); }
    .toast__close { flex-shrink: 0; color: inherit; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(8px); } }
    @media (max-width: 480px) { .toast-host { inset-inline: var(--space-2); inset-block-end: var(--space-2); width: auto; } }
  `,
  template: `
    <ul class="toast-host" aria-live="polite" aria-relevant="additions">
      @for (toast of center.toasts(); track toast.id) {
        <li class="toast" [class.toast--info]="toast.tone === 'info'">
          <app-icon class="toast__icon" [name]="toast.tone === 'info' ? 'info-circle' : 'circle-check'" />
          <p class="toast__text">{{ toast.messageKey | translate: toast.params }}</p>
          <button class="ui-button ui-button--ghost ui-button--icon ui-button--small toast__close" type="button"
            [attr.aria-label]="'shared.actions.close' | translate" (click)="center.dismiss(toast.id)">
            <app-icon class="ui-button__icon" name="x" />
          </button>
        </li>
      }
    </ul>
  `,
})
export class ToastHost {
  protected readonly center = inject(ToastCenter);
}
