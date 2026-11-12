import { Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreDirectoryStore } from '@stores/application/store-directory.store';
import type { Store } from '@stores/domain/model/store-hierarchy';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

const NOTICES = ['unavailable', 'unreachable'] as const;

/**
 * Store directory after sign-in: no stores -> onboarding form; one store -> opened automatically (once
 * per session); several -> pick one. A new store can always be created here.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ErrorNotice, Icon, StatePanel, LocalizedDatePipe],
  selector: 'app-store-directory-view',
  templateUrl: './store-directory.html',
})
export class StoreDirectoryView {
  protected readonly directory = inject(StoreDirectoryStore);
  private readonly router = inject(Router);
  protected readonly stores = this.directory.stores;
  protected readonly createState = this.directory.createState;

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

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, address } = this.form.getRawValue();
    this.directory.submitCreateStore(name, address, (store: Store) => {
      this.form.reset();
      void this.router.navigate(['/stores', store.id, 'setup', 'areas']);
    });
  }

  protected invalid(name: 'name' | 'address'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }
}
