import { Component, DestroyRef, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { MONITORING_POLL_MS, MonitoringStore } from '@monitoring/application/monitoring.store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Freshness } from '@shared/presentation/components/freshness/freshness';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag, type StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Sensor connectivity of the store (US21), polled about every 30 s. */
@Component({
  imports: [RouterLink, TranslatePipe, ErrorNotice, Freshness, StatePanel, StatusTag, LocalizedDatePipe],
  selector: 'app-sensor-connectivity-view',
  template: `
    <div class="ui-stack">
      <header class="ui-page-header">
        <div>
          <h1 class="ui-page-header__title">{{ 'monitoring.connectivity.title' | translate }}</h1>
          <app-freshness [lastUpdatedAt]="connectivity.lastUpdatedAt()" [stale]="connectivity.stale()" [refreshing]="connectivity.loading()"
            [note]="'shared.freshness.every' | translate: { seconds: pollSeconds }" />
        </div>
      </header>
      @if (connectivity.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (connectivity.error() && !connectivity.data()) {
        <app-error-notice [error]="connectivity.error()!" />
      } @else if (connectivity.data(); as data) {
        <div class="ui-grid">
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'monitoring.connectivity.connected' | translate }}</p><p class="ui-kpi__value">{{ data.connected }}/{{ data.totalSensors }}</p></div>
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'monitoring.connectivity.disconnected' | translate }}</p><p class="ui-kpi__value">{{ data.disconnected }}</p></div>
          <div class="ui-kpi">
            <p class="ui-kpi__label">{{ 'monitoring.connectivity.lastEdgeSync' | translate }}</p>
            <p class="ui-flush">{{ data.lastEdgeSyncAt ? (data.lastEdgeSyncAt | localizedDate: 'dateTime') : ('monitoring.connectivity.never' | translate) }}</p>
          </div>
        </div>
        @if (data.sensors.length === 0) {
          <app-state-panel kind="empty" [heading]="'monitoring.connectivity.empty' | translate" [message]="'monitoring.connectivity.emptyMessage' | translate">
            <a class="ui-button" [routerLink]="['/stores', storeId(), 'setup', 'areas']">{{ 'monitoring.dashboard.configure' | translate }}</a>
          </app-state-panel>
        } @else {
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'monitoring.connectivity.title' | translate">
            <table class="ui-table">
              <thead><tr>
                <th scope="col">{{ 'monitoring.connectivity.equipment' | translate }}</th>
                <th scope="col">{{ 'monitoring.connectivity.status' | translate }}</th>
                <th scope="col">{{ 'monitoring.connectivity.serial' | translate }}</th>
                <th scope="col">{{ 'monitoring.connectivity.lastTelemetry' | translate }}</th>
                <th scope="col" class="num">{{ 'monitoring.connectivity.threshold' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (s of data.sensors; track s.sensorId) {
                  <tr>
                    <th scope="row"><a [routerLink]="['/stores', storeId(), 'monitoring', 'areas', s.areaId, 'equipment', s.equipmentId]">{{ s.equipmentName }}</a><br /><span class="text-meta">{{ s.areaName }}</span></th>
                    <td><app-status-tag [label]="'monitoring.connectivity.' + (s.status === 'CONNECTED' ? 'connected' : 'disconnected') | translate" [appearance]="s.status === 'CONNECTED' ? online : offline" /></td>
                    <td>{{ s.serialNumber }}</td>
                    <td>{{ s.lastTelemetryAt ? (s.lastTelemetryAt | localizedDate: 'dateTime') : ('monitoring.connectivity.never' | translate) }}</td>
                    <td class="num">{{ s.disconnectionThresholdMin }} min</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
})
export class SensorConnectivityView {
  readonly storeId = input.required<string>();
  private readonly monitoring = inject(MonitoringStore);
  protected readonly connectivity = this.monitoring.connectivity;
  protected readonly pollSeconds = MONITORING_POLL_MS.connectivity / 1000;
  protected readonly online: StatusAppearance = { tone: 'info', icon: 'wifi' };
  protected readonly offline: StatusAppearance = { tone: 'neutral', icon: 'wifi-off' };

  constructor() {
    let subscription: Subscription | null = null;
    whenChanged(this.storeId, (storeId) => {
      subscription?.unsubscribe();
      subscription = this.monitoring.watchConnectivity(storeId);
    });
    inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
    redirectOnStoreNotFound(this.connectivity.error);
  }
}
