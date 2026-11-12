import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

/**
 * Requests a password-reset link. The API always answers success (no account enumeration), and the
 * email may only be logged when SMTP is not configured, so the confirmation never promises delivery.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, ErrorNotice, Icon],
  selector: 'app-forgot-password-view',
  styleUrl: '../../styles/iam-card.css',
  template: `
    <app-public-layout>
      <section class="ui-card iam-card" aria-labelledby="forgot-title">
        <header class="iam-card__header">
          <h1 id="forgot-title">{{ 'iam.forgotPassword.title' | translate }}</h1>
          <p class="ui-page-header__subtitle">{{ 'iam.forgotPassword.subtitle' | translate }}</p>
        </header>

        @if (state.succeededAt()) {
          <div class="ui-notice ui-notice--success" role="status">
            <app-icon class="ui-notice__icon" name="mail" />
            <p class="ui-notice__body">{{ 'iam.forgotPassword.sent' | translate }}</p>
          </div>
        } @else {
          @if (state.error(); as failure) {
            <app-error-notice [error]="failure" />
          }
          <form class="ui-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="ui-field">
              <label class="ui-field__label" for="forgot-email">{{ 'iam.fields.email' | translate }}</label>
              <input
                class="ui-input"
                id="forgot-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                [attr.aria-invalid]="(form.controls.email.invalid && form.controls.email.touched) || null"
                [attr.aria-describedby]="form.controls.email.invalid && form.controls.email.touched ? 'forgot-email-error' : null"
              />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <p class="ui-field__error" id="forgot-email-error">{{ 'iam.validation.email' | translate }}</p>
              }
            </div>
            <button class="ui-button iam-card__submit" type="submit" [disabled]="state.submitting()">
              {{ (state.submitting() ? 'iam.forgotPassword.submitting' : 'iam.forgotPassword.submit') | translate }}
            </button>
          </form>
        }

        <p class="iam-card__footer"><a routerLink="/sign-in">{{ 'iam.backToSignIn' | translate }}</a></p>
      </section>
    </app-public-layout>
  `,
})
export class ForgotPasswordView {
  private readonly store = inject(IamStore);
  protected readonly state = this.store.passwordResetRequestState;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.state.clear();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.requestPasswordReset(this.form.getRawValue().email);
  }
}
