import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { DataQuality } from '@shared/domain/data-quality';
import { Icon, type IconName } from '@shared/presentation/components/icon/icon';

const LABEL_KEYS: Readonly<Record<DataQuality, string>> = {
  fresh: 'shared.dataQuality.fresh',
  stale: 'shared.dataQuality.stale',
  partial: 'shared.dataQuality.partial',
  insufficient: 'shared.dataQuality.insufficient',
  'no-data': 'shared.dataQuality.noData',
};

const ICONS: Readonly<Record<DataQuality, IconName>> = {
  fresh: 'circle-check',
  stale: 'alert-triangle',
  partial: 'alert-triangle',
  insufficient: 'alert-triangle',
  'no-data': 'info-circle',
};

/**
 * Labelled data-quality state (text and icon, never colour alone). Use it in place of a value whenever
 * the quality is not `fresh`, so insufficient telemetry is never shown as a healthy result.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-data-quality',
  template: `
    <span class="ui-tag" [class.ui-tag--warning]="quality() !== 'fresh' && quality() !== 'no-data'">
      <app-icon class="ui-tag__icon" [name]="icon()" />
      {{ labelKey() | translate }}
    </span>
  `,
})
export class DataQualityTag {
  readonly quality = input.required<DataQuality>();
  protected readonly labelKey = computed(() => LABEL_KEYS[this.quality()]);
  protected readonly icon = computed(() => ICONS[this.quality()]);
}
