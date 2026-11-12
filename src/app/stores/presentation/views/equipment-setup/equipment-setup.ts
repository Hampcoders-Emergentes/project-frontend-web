import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { type EquipmentAddress, EquipmentSetupStore } from '@stores/application/equipment-setup.store';
import type { ElectricalThresholds } from '@stores/domain/model/equipment-safety';
import {
  type BindingRequest,
  DeviceBindingPanel,
} from '@stores/presentation/components/device-binding-panel/device-binding-panel';
import { EquipmentThresholdForm } from '@stores/presentation/components/equipment-threshold-form/equipment-threshold-form';
import {
  ShutdownProtocolForm,
  type ShutdownProtocolDraft,
} from '@stores/presentation/components/shutdown-protocol-form/shutdown-protocol-form';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Equipment configuration: sensor binding, electrical thresholds and shutdown protocol. */
@Component({
  imports: [RouterLink, TranslatePipe, DeviceBindingPanel, EquipmentThresholdForm, ShutdownProtocolForm, ErrorNotice, Icon, StatePanel],
  selector: 'app-equipment-setup-view',
  template: `
    <div class="ui-stack">
      <header class="ui-page-header">
        <div>
          <p class="text-meta ui-flush">
            <a [routerLink]="['/stores', storeId(), 'setup', 'areas']">{{ 'stores.hierarchy.title' | translate }}</a>
          </p>
          <h1 class="ui-page-header__title">{{ setup.equipment.data()?.name ?? ('stores.setup.title' | translate) }}</h1>
          <p class="ui-page-header__subtitle">{{ 'stores.setup.subtitle' | translate }}</p>
        </div>
        <a class="ui-button ui-button--secondary" [routerLink]="['/stores', storeId(), 'monitoring', 'areas', areaId(), 'equipment', equipmentId()]">
          <app-icon class="ui-button__icon" name="wave-saw-tool" />
          {{ 'stores.hierarchy.monitor' | translate }}
        </a>
      </header>

      @if (setup.binding.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'stores.binding.loading' | translate" />
      } @else if (setup.binding.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="setup.loadBinding(address())" />
      } @else {
        <app-device-binding-panel
          [binding]="setup.binding.data()"
          [submitting]="setup.bindState.submitting()"
          [error]="setup.bindState.error()"
          (bind)="bind($event)"
        />
      }

      @if (setup.thresholds.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'stores.thresholds.loading' | translate" />
      } @else if (setup.thresholds.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="setup.load(address())" />
      } @else {
        <app-equipment-threshold-form
          [thresholds]="setup.thresholds.data()"
          [submitting]="setup.thresholdsState.submitting()"
          [error]="setup.thresholdsState.error()"
          [saved]="setup.thresholdsState.succeededAt() !== null"
          (save)="saveThresholds($event)"
        />
      }

      @if (setup.protocol.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'stores.protocol.loading' | translate" />
      } @else if (setup.protocol.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="setup.load(address())" />
      } @else {
        <app-shutdown-protocol-form
          [protocol]="setup.protocol.data()"
          [submitting]="setup.protocolState.submitting()"
          [error]="setup.protocolState.error()"
          [saved]="setup.protocolState.succeededAt() !== null"
          (save)="saveProtocol($event)"
        />
      }
    </div>
  `,
})
export class EquipmentSetupView {
  readonly storeId = input.required<string>();
  readonly areaId = input.required<string>();
  readonly equipmentId = input.required<string>();
  protected readonly setup = inject(EquipmentSetupStore);
  protected readonly address = computed<EquipmentAddress>(() => ({
    storeId: this.storeId(),
    areaId: this.areaId(),
    equipmentId: this.equipmentId(),
  }));

  constructor() {
    whenChanged(this.address, (address) => this.setup.load(address));
    redirectOnStoreNotFound(this.setup.equipment.error);
  }

  protected bind(request: BindingRequest): void {
    this.setup.bind(this.address(), request.deviceId, request.edgeDeviceId, () => undefined);
  }

  protected saveThresholds(thresholds: ElectricalThresholds): void {
    this.setup.saveThresholds(this.address(), thresholds);
  }

  protected saveProtocol(draft: ShutdownProtocolDraft): void {
    this.setup.saveProtocol(this.address(), draft);
  }
}
