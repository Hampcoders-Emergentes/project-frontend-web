import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreDirectoryStore } from '@stores/application/store-directory.store';
import type { Store } from '@stores/domain/model/store-hierarchy';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon, type IconName } from '@shared/presentation/components/icon/icon';
import { Skeleton } from '@shared/presentation/components/skeleton/skeleton';
import { ToastCenter } from '@shared/presentation/components/toast/toast-center';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

const NOTICES = ['unavailable', 'unreachable'] as const;

interface OnboardingStep {
  readonly key: 'register' | 'configure' | 'bind';
  readonly icon: IconName;
}

/**
 * Store directory after sign-in: no stores -> guided onboarding with the create form; one store ->
 * opened automatically (once per session); several -> a grid of store cards with a collapsible
 * "add store" panel. A newly created store opens its area setup with a confirmation toast.
 */
@Component({
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ErrorNotice,
    Icon,
    Skeleton,
    LocalizedDatePipe,
  ],
  selector: 'app-store-directory-view',
  styleUrl: './store-directory.css',
  templateUrl: './store-directory.html',
})
export class StoreDirectoryView {
  protected readonly directory = inject(StoreDirectoryStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastCenter);
  protected readonly stores = this.directory.stores;
  protected readonly createState = this.directory.createState;

  protected readonly steps: readonly OnboardingStep[] = [
    { key: 'register', icon: 'building-store' },
    { key: 'configure', icon: 'cpu' },
    { key: 'bind', icon: 'wifi' },
  ];

  /** First-time onboarding: the list loaded and the user owns no store yet. */
  protected readonly onboarding = computed(() => this.stores.data()?.length === 0);
  protected readonly createOpen = signal(false);

  protected readonly notice = (() => {
    const value = inject(ActivatedRoute).snapshot.queryParamMap.get('notice');
    return NOTICES.find((notice) => notice === value) ?? null;
  })();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    address: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    this.createState.clear();
    this.directory.loadStores();
    effect(() => {
      const bootstrap = this.directory.bootstrap();
      if (bootstrap?.kind === 'single' && this.notice === null && this.directory.consumeAutomaticSelection()) {
        void this.router.navigate(['/stores', bootstrap.storeId, 'dashboard'], { replaceUrl: true });
      } else if (bootstrap !== null) {
        this.directory.consumeAutomaticSelection();
      }
    });
    effect(() => applyServerFieldErrors(this.form, this.createState.error()));
  }

  protected toggleCreate(): void {
    this.createOpen.update((open) => !open);
    if (!this.createOpen()) {
      this.form.reset();
      this.createState.clear();
    }
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, address } = this.form.getRawValue();
    this.directory.submitCreateStore(name, address, (store: Store) => {
      this.form.reset();
      this.createOpen.set(false);
      this.toasts.show('stores.directory.created', { name: store.name });
      void this.router.navigate(['/stores', store.id, 'setup', 'areas']);
    });
  }

  protected invalid(name: 'name' | 'address'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }
}
