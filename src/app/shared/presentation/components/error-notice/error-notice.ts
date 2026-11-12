import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  type AppError,
  type ErrorCodeMessages,
  errorKindOf,
  errorMessageKeyFor,
} from '@shared/application/app-error';
import { SHARED_ERROR_CODE_MESSAGES } from '@shared/presentation/errors/shared-error-codes';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Inline, translated feedback for a failed request. It never renders backend text: the message is
 * chosen from the HTTP status, and the trace id is shown for support. A context may pass a more
 * specific translated `message` (for example for a `409` or `422` of its own workflow).
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-error-notice',
  template: `
    <div class="ui-notice ui-notice--error" role="alert">
      <app-icon class="ui-notice__icon" name="alert-circle" />
      <div class="ui-notice__body">
        <p class="ui-notice__text">{{ message() ?? (messageKey() | translate) }}</p>
        @if (error().traceId; as traceId) {
          <p class="text-meta">{{ 'shared.errors.traceId' | translate: { traceId } }}</p>
        }
      </div>
      @if (retryable()) {
        <button class="ui-button ui-button--secondary ui-button--small" type="button" (click)="retry.emit()">
          <app-icon class="ui-button__icon" name="refresh" />
          {{ (kind() === 'conflict' ? 'shared.actions.reload' : 'shared.actions.retry') | translate }}
        </button>
      }
    </div>
  `,
})
export class ErrorNotice {
  readonly error = input.required<AppError>();
  /** A translated, context-specific message that replaces the generic one. */
  readonly message = input<string | null>(null);
  /** Whether to offer the retry/reload action. */
  readonly retryable = input(false);
  /** Context-specific translations per `errorCode`; shared codes always apply. */
  readonly codeMessages = input<ErrorCodeMessages>({});
  readonly retry = output<void>();

  protected readonly kind = computed(() => errorKindOf(this.error()));
  protected readonly messageKey = computed(() =>
    errorMessageKeyFor(this.error(), { ...SHARED_ERROR_CODE_MESSAGES, ...this.codeMessages() }),
  );
}
