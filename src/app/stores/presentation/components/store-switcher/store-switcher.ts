import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreDirectoryStore } from '@stores/application/store-directory.store';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Header link back to the store list, store selector and live-update status. Switching navigates to the other store's dashboard
 * (the route guard verifies ownership and moves the realtime membership); the store list is loaded
 * lazily the first time the selector is rendered.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon],
  selector: 'app-store-switcher',
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
    .switcher { display: flex; align-items: center; gap: 0.5rem; }
    .switcher select { min-width: 12rem; max-width: 18rem; }
    .all-stores { color: var(--text-secondary); }
    @media (max-width: 640px) { .switcher select { min-width: 0; max-width: 11rem; } .live span, .all-stores span { display: none; } }
  `,
  template: `
    <a class="ui-button ui-button--ghost ui-button--small all-stores" routerLink="/stores"
      [attr.aria-label]="'stores.switcher.allStores' | translate">
      <app-icon class="ui-button__icon" name="chevron-left" />
      <span>{{ 'stores.switcher.allStores' | translate }}</span>
    </a>
    @if (directory.activeStore(); as active) {
      <label class="switcher">
        <app-icon name="building-store" />
        <span class="sr-only">{{ 'stores.switcher.label' | translate }}</span>
        <select class="ui-input" [value]="active.id" (change)="switchTo($event)">
          @for (store of options(); track store.id) {
            <option [value]="store.id">{{ store.name }}</option>
          }
        </select>
      </label>
    }
    <span class="ui-tag live" role="status" [class.ui-tag--info]="live()" [class.ui-tag--warning]="liveState() === 'reconnecting'"
      [attr.title]="liveLabel() | translate">
      <app-icon class="ui-tag__icon" [name]="live() ? 'broadcast' : liveState() === 'reconnecting' ? 'loader-2' : 'refresh'" />
      <span>{{ liveLabel() | translate }}</span>
    </span>
  `,
})
export class StoreSwitcher {
  protected readonly directory = inject(StoreDirectoryStore);
  private readonly router = inject(Router);

  protected readonly live = computed(() => this.directory.realtimeStatus() === 'connected');
  /** `live` when connected, `reconnecting` while (re)connecting, otherwise `polling` (fallback). */
  protected readonly liveState = computed(() => {
    const status = this.directory.realtimeStatus();
    if (status === 'connected') {
      return 'live';
    }
    return status === 'connecting' || status === 'reconnecting' ? 'reconnecting' : 'polling';
  });
  protected readonly liveLabel = computed(() => `stores.switcher.${this.liveState()}`);
  /** The owned stores, always including the active one while the list is loading. */
  protected readonly options = computed(() => {
    const stores = this.directory.stores.data() ?? [];
    const active = this.directory.activeStore();
    return active !== null && !stores.some((store) => store.id === active.id) ? [active, ...stores] : stores;
  });

  constructor() {
    if (this.directory.stores.data() === null && !this.directory.stores.loading()) {
      this.directory.loadStores();
    }
  }

  protected switchTo(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.value !== this.directory.activeStore()?.id) {
      void this.router.navigate(['/stores', target.value, 'dashboard']);
    }
  }
}
