import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import {
  NEW_PASSWORD_VALIDATORS,
  newPasswordErrorKey,
  passwordsMatch,
} from '@iam/presentation/password-validators';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';
import { PASSWORD_MIN_LENGTH } from '@iam/domain/model/authenticated-user';

/**
 * Completes the emailed reset link `/reset-password?token=...`. The token is read once, kept in memory
 * and removed from the address bar. A success ends every session, so the user signs in again.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, ErrorNotice, Icon],
  selector: 'app-reset-password-view',
  styleUrl: '../../styles/iam-card.css',
  templateUrl: './reset-password.html',
})
export class ResetPasswordView {
  private readonly store = inject(IamStore);
  protected readonly state = this.store.passwordResetState;
  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly newPasswordErrorKey = newPasswordErrorKey;
  private readonly resetToken: string | null;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      newPassword: ['', NEW_PASSWORD_VALIDATORS],
      newPasswordConfirmation: [''],
    },
    { validators: passwordsMatch('newPassword', 'newPasswordConfirmation') },
  );

  constructor() {
    const route = inject(ActivatedRoute);
    this.resetToken = route.snapshot.queryParamMap.get('token');
    this.state.clear();
    if (this.resetToken !== null) {
      void inject(Router).navigate([], { relativeTo: route, queryParams: {}, replaceUrl: true });
    }
  }

  protected get hasToken(): boolean {
    return this.resetToken !== null && this.resetToken !== '';
  }

  protected submit(): void {
    if (this.form.invalid || this.resetToken === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.resetPassword({ resetToken: this.resetToken, ...this.form.getRawValue() });
  }
}
