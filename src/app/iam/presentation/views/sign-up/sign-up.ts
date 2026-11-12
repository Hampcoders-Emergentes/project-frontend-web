import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { PASSWORD_MIN_LENGTH } from '@iam/domain/model/authenticated-user';
import { IAM_ERROR_CODE_MESSAGES, IAM_FIELD_CODE_MESSAGES } from '@iam/presentation/iam-error-codes';
import {
  NEW_PASSWORD_VALIDATORS,
  newPasswordErrorKey,
  passwordsMatch,
} from '@iam/presentation/password-validators';
import type { AppError, ErrorCodeMessages } from '@shared/application/app-error';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';
import {
  applyServerFieldErrors,
  showControlError,
} from '@shared/presentation/forms/server-field-errors';

/** A generic `VALIDATION_FAILED` (400) gets the "check the details" copy; specific codes win. */
const SIGN_UP_ERROR_CODE_MESSAGES: ErrorCodeMessages = {
  ...IAM_ERROR_CODE_MESSAGES,
  VALIDATION_FAILED: 'iam.signUp.errors.rejected',
};

type SignUpField = 'email' | 'password' | 'passwordConfirmation';

/**
 * Creates a store-manager account (`POST /auth/sign-up`). Success starts the session and opens the
 * store list, where an account without stores lands in onboarding. Failures are shown by their
 * `errorCode` and field codes, translated here; backend text is never rendered.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, ErrorNotice, Icon],
  selector: 'app-sign-up-view',
  styleUrl: '../../styles/iam-card.css',
  templateUrl: './sign-up.html',
})
export class SignUpView {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);
  protected readonly state = this.store.signUpState;
  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly errorCodeMessages = SIGN_UP_ERROR_CODE_MESSAGES;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', NEW_PASSWORD_VALIDATORS],
      passwordConfirmation: [''],
    },
    { validators: passwordsMatch('password', 'passwordConfirmation') },
  );

  constructor() {
    this.state.clear();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.signUp(
      this.form.getRawValue(),
      () => void this.router.navigateByUrl('/stores'),
      (error: AppError) => {
        applyServerFieldErrors(this.form, error);
      },
    );
  }

  protected invalid(name: SignUpField): boolean {
    return showControlError(this.form.controls[name]);
  }

  /**
   * Translation key of the message under a field, or null when there is none. A server field code wins
   * over the client rules; unknown codes fall back to a generic rejection message.
   */
  protected messageFor(name: SignUpField): string | null {
    const control = this.form.controls[name];
    const serverCode = control.getError('server');
    if (typeof serverCode === 'string') {
      return IAM_FIELD_CODE_MESSAGES[serverCode] ?? 'shared.validation.serverRejected';
    }
    if (name === 'passwordConfirmation') {
      return control.touched && this.form.hasError('passwordMismatch') ? 'iam.validation.passwordMismatch' : null;
    }
    if (!showControlError(control)) {
      return null;
    }
    if (name === 'email') {
      return control.hasError('required') ? 'iam.validation.required' : 'iam.validation.email';
    }
    return newPasswordErrorKey(control);
  }
}
