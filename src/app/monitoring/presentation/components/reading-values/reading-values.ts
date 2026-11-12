import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  type ElectricalReading,
  hasFreshTelemetry,
  type OperationalState,
  type TelemetryState,
} from '@monitoring/domain/model/monitoring';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/**
 * Label/value rows of an electrical reading with units. When the telemetry is stale, unknown or
 * absent, it says "no fresh data" (with the last capture time if any) instead of showing values that
 * could be mistaken for current ones.
 */
@Component({
  imports: [TranslatePipe, Icon, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-reading-values',
  template: `
    @if (reading(); as value) {
      @if (fresh()) {
        <dl class="ui-dl tnum">
          <dt>{{ 'monitoring.reading.voltage' | translate }}</dt><dd>{{ value.voltage | localizedNumber: 1 }} V</dd>
          <dt>{{ 'monitoring.reading.current' | translate }}</dt><dd>{{ value.current | localizedNumber: 2 }} A</dd>
          @if (value.activePowerKw !== null) {
            <dt>{{ 'monitoring.reading.power' | translate }}</dt><dd>{{ value.activePowerKw | localizedNumber: 2 }} kW</dd>
          }
          <dt>{{ 'monitoring.reading.powerFactor' | translate }}</dt><dd>{{ value.powerFactor | localizedNumber: 2 }}</dd>
          <dt>{{ 'monitoring.reading.frequency' | translate }}</dt><dd>{{ value.frequency | localizedNumber: 1 }} Hz</dd>
          @if (value.leakageCurrentAmps !== null) {
            <dt>{{ 'monitoring.reading.leakage' | translate }}</dt><dd>{{ value.leakageCurrentAmps * 1000 | localizedNumber: 1 }} mA</dd>
          }
        </dl>
        <p class="text-meta" style="margin: 0">{{ 'monitoring.reading.capturedAt' | translate: { time: (value.capturedAt | localizedDate: 'dateTime') } }}</p>
      } @else {
        <p class="ui-tag ui-tag--warning" style="margin: 0; justify-self: start">
          <app-icon class="ui-tag__icon" name="clock" />{{ 'monitoring.reading.noFreshData' | translate }}
        </p>
        <p class="text-meta" style="margin: 0">{{ 'monitoring.reading.lastCaptured' | translate: { time: (value.capturedAt | localizedDate: 'dateTime') } }}</p>
      }
    } @else {
      <p class="ui-tag" style="margin: 0; justify-self: start">
        <app-icon class="ui-tag__icon" name="wifi-off" />{{ 'monitoring.reading.noData' | translate }}
      </p>
    }
  `,
  styles: ':host { display: grid; gap: 0.5rem; }',
})
export class ReadingValues {
  readonly reading = input<ElectricalReading | null>(null);
  readonly state = input.required<OperationalState | TelemetryState>();
  protected readonly fresh = computed(() => hasFreshTelemetry(this.state()));
}
