import { Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';
import { showControlError } from '@shared/presentation/forms/server-field-errors';

const REASONS = ['signedOut', 'expired', 'inactive', 'unreachable', 'passwordReset'] as const;
type SignInReason = (typeof REASONS)[number];

/** Sign-in with email and password (US08 entry point). */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, ErrorNotice, Icon],
  selector: 'app-sign-in-view',
  styleUrl: '../../styles/iam-card.css',
  templateUrl: './sign-in.html',
})
export class SignInView {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly reason: SignInReason | null = (() => {
    const value = this.route.snapshot.queryParamMap.get('reason');
    return REASONS.find((reason) => reason === value) ?? null;
  })();

  protected readonly error = this.store.signInState.error;
  /** 401 and 403 have specific sign-in meanings; other failures use the generic notice. */
  protected readonly specificErrorKey = computed(() => {
    const failure = this.error();
    if (failure?.status === 401) {
      return 'iam.signIn.errors.invalidCredentials';
    }
    if (failure?.status === 403) {
      return failure.code === 'ACCOUNT_NOT_ACTIVE' ? 'iam.errorCodes.ACCOUNT_NOT_ACTIVE' : 'iam.signIn.errors.inactive';
    }
    return null;
  });

  constructor() {
    this.store.signInState.clear();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target = returnUrl?.startsWith('/stores') ? returnUrl : '/stores';
    this.store.signIn(this.form.getRawValue(), () => void this.router.navigateByUrl(target));
  }

  protected invalid(name: 'email' | 'password'): boolean {
    return showControlError(this.form.controls[name]) && this.form.controls[name].touched;
  }
}
