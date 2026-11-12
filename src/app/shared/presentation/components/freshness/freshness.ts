import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/**
 * Shows when polled data was last updated and labels it as outdated when the last refresh failed, so
 * old values are never mistaken for current ones. Not a live region: refreshes are not announced.
 */
@Component({
  imports: [TranslatePipe, Icon, LocalizedDatePipe],
  selector: 'app-freshness',
  template: `
    <p class="ui-freshness text-meta">
      @if (refreshing()) {
        <app-icon name="loader-2" />
      } @else {
        <app-icon name="clock" />
      }
      @if (lastUpdatedAt(); as updated) {
        <span>{{ 'shared.freshness.updatedAt' | translate: { time: (updated | localizedDate: 'dateTime') } }}</span>
      } @else {
        <span>{{ 'shared.freshness.never' | translate }}</span>
      }
      @if (stale()) {
        <span class="ui-tag ui-tag--warning">
          <app-icon class="ui-tag__icon" name="alert-triangle" />
          {{ 'shared.freshness.stale' | translate }}
        </span>
      }
      @if (note(); as text) {
        <span>· {{ text }}</span>
      }
    </p>
  `,
})
export class Freshness {
  readonly lastUpdatedAt = input<Date | null>(null);
  readonly stale = input(false);
  readonly refreshing = input(false);
  /** Optional translated note, such as the polling cadence. */
  readonly note = input<string | null>(null);
}
