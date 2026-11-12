import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { Alert, AlertSeverity, AlertStatus } from '@alerts/domain/model/alert';
import type { AlertEquipmentRef } from '@alerts/application/ports/alert-equipment-directory.port';
import { StatusTag, type StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

export const SEVERITY_APPEARANCE: Readonly<Record<AlertSeverity, StatusAppearance>> = {
  CRITICAL: { tone: 'critical', icon: 'alert-octagon' },
  NON_CRITICAL: { tone: 'warning', icon: 'alert-triangle' },
};

export const STATUS_APPEARANCE: Readonly<Record<AlertStatus, StatusAppearance>> = {
  OPEN: { tone: 'critical', icon: 'bell-ringing' },
  ACKNOWLEDGED: { tone: 'warning', icon: 'check' },
  ASSIGNED: { tone: 'info', icon: 'tool' },
  RESOLVED: { tone: 'success', icon: 'circle-check' },
};

/**
 * Alert history table: severity label, equipment, timestamp, status, on-duty worker and assigned
 * technician. Each alert is its own row (alerts are not grouped into incidents).
 */
@Component({
  imports: [TranslatePipe, StatusTag, LocalizedDatePipe],
  selector: 'app-alert-table',
  template: `
    <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="caption()">
      <table class="ui-table">
        <thead>
          <tr>
            <th scope="col">{{ 'alerts.fields.severity' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.equipment' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.anomaly' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.createdAt' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.status' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.onDuty' | translate }}</th>
            <th scope="col">{{ 'alerts.fields.technician' | translate }}</th>
            <th scope="col"><span class="sr-only">{{ 'shared.labels.actions' | translate }}</span></th>
          </tr>
        </thead>
        <tbody>
          @for (alert of alerts(); track alert.id) {
            <tr>
              <td><app-status-tag [label]="'alerts.severity.' + alert.severity | translate" [appearance]="severityAppearance[alert.severity]" /></td>
              <th scope="row">
                {{ equipment().get(alert.equipmentId)?.equipmentName ?? ('alerts.unknownEquipment' | translate) }}
                @if (equipment().get(alert.equipmentId); as ref) { <br /><span class="text-meta">{{ ref.areaName }}</span> }
              </th>
              <td>
                {{ 'alerts.anomaly.' + alert.anomalyType | translate }}
                @if (alert.isCriticalLeakage) { <br /><strong class="text-meta">{{ 'alerts.criticalLeakage' | translate }}</strong> }
              </td>
              <td>{{ alert.createdAt | localizedDate: 'dateTime' }}</td>
              <td><app-status-tag [label]="'alerts.status.' + alert.status | translate" [appearance]="statusAppearance[alert.status]" /></td>
              <td>{{ alert.onDutyWorker ? alert.onDutyWorker.workerName + ' (' + alert.onDutyWorker.workerCode + ')' : ('alerts.noOnDuty' | translate) }}</td>
              <td>{{ alert.assignedTechnicianName ?? alert.assignedTechnicianId ?? '—' }}</td>
              <td>
                <button class="ui-button ui-button--secondary ui-button--small" type="button" (click)="selected.emit(alert)">
                  {{ 'alerts.open' | translate }}<span class="sr-only"> {{ 'alerts.anomaly.' + alert.anomalyType | translate }}</span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AlertTable {
  readonly alerts = input.required<readonly Alert[]>();
  readonly equipment = input.required<ReadonlyMap<string, AlertEquipmentRef>>();
  /** Translated accessible name of the table region. */
  readonly caption = input.required<string>();
  readonly selected = output<Alert>();

  protected readonly severityAppearance = SEVERITY_APPEARANCE;
  protected readonly statusAppearance = STATUS_APPEARANCE;
}
