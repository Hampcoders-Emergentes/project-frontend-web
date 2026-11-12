import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { PASSWORD_MIN_LENGTH } from '@iam/domain/model/authenticated-user';
import {
  NEW_PASSWORD_VALIDATORS,
  newPasswordErrorKey,
  passwordsMatch,
} from '@iam/presentation/password-validators';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';

/** Change password of the signed-in user (`PUT /users/{id}/password`). */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, Icon],
  selector: 'app-change-password-view',
  template: `
    <section class="ui-card ui-stack" aria-labelledby="change-password-title">
      <h2 id="change-password-title">{{ 'iam.changePassword.title' | translate }}</h2>
      @if (state.succeededAt()) {
        <div class="ui-notice ui-notice--success" role="status">
          <app-icon class="ui-notice__icon" name="circle-check" />
          <p class="ui-notice__body">{{ 'iam.changePassword.done' | translate }}</p>
        </div>
      }
      @if (state.error(); as failure) {
        <app-error-notice
          [error]="failure"
          [message]="failure.status === 400 ? ('iam.changePassword.rejected' | translate) : null"
        />
      }
      <form class="ui-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="ui-form-grid">
          <div class="ui-field ui-field--full">
            <label class="ui-field__label" for="cp-current">{{ 'iam.fields.currentPassword' | translate }}</label>
            <input class="ui-input" id="cp-current" type="password" formControlName="currentPassword" autocomplete="current-password"
              [attr.aria-invalid]="(form.controls.currentPassword.invalid && form.controls.currentPassword.touched) || null" />
            @if (form.controls.currentPassword.invalid && form.controls.currentPassword.touched) {
              <p class="ui-field__error">{{ 'iam.validation.required' | translate }}</p>
            }
          </div>
          <div class="ui-field">
            <label class="ui-field__label" for="cp-new">{{ 'iam.fields.newPassword' | translate }}</label>
            <input class="ui-input" id="cp-new" type="password" formControlName="newPassword" autocomplete="new-password"
              aria-describedby="cp-new-hint"
              [attr.aria-invalid]="(form.controls.newPassword.invalid && form.controls.newPassword.touched) || null" />
            <p class="ui-field__hint" id="cp-new-hint">{{ 'iam.validation.passwordHint' | translate: { min: minLength } }}</p>
            @if (form.controls.newPassword.invalid && form.controls.newPassword.touched) {
              <p class="ui-field__error">{{ newPasswordErrorKey(form.controls.newPassword) | translate }}</p>
            }
          </div>
          <div class="ui-field">
            <label class="ui-field__label" for="cp-confirm">{{ 'iam.fields.confirmPassword' | translate }}</label>
            <input class="ui-input" id="cp-confirm" type="password" formControlName="confirmation" autocomplete="new-password"
              [attr.aria-invalid]="(form.hasError('passwordMismatch') && form.controls.confirmation.touched) || null" />
            @if (form.hasError('passwordMismatch') && form.controls.confirmation.touched) {
              <p class="ui-field__error">{{ 'iam.validation.passwordMismatch' | translate }}</p>
            }
          </div>
        </div>
        <div class="ui-actions">
          <button class="ui-button" type="submit" [disabled]="state.submitting()">
            {{ (state.submitting() ? 'shared.actions.saving' : 'iam.changePassword.submit') | translate }}
          </button>
        </div>
      </form>
    </section>
  `,
})
export class ChangePasswordView {
  private readonly store = inject(IamStore);
  protected readonly state = this.store.passwordChangeState;
  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly newPasswordErrorKey = newPasswordErrorKey;
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', NEW_PASSWORD_VALIDATORS],
      confirmation: [''],
    },
    { validators: passwordsMatch('newPassword', 'confirmation') },
  );

  constructor() {
    this.state.clear();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.store.changePassword({ currentPassword, newPassword }, () => this.form.reset());
  }
}
