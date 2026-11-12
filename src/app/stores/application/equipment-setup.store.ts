import { inject, Injectable } from '@angular/core';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import type { ElectricalThresholds, SafeToCleanRule, ShutdownProtocol } from '@stores/domain/model/equipment-safety';
import type { DeviceBinding, Equipment } from '@stores/domain/model/store-hierarchy';
import {
  GetEquipmentThresholdUseCase,
  GetShutdownProtocolUseCase,
  UpdateEquipmentThresholdUseCase,
  UpdateShutdownProtocolUseCase,
} from '@stores/application/use-cases/equipment-safety-use-cases';
import {
  BindEquipmentDeviceUseCase,
  GetEquipmentDeviceBindingUseCase,
  GetEquipmentUseCase,
} from '@stores/application/use-cases/store-hierarchy-use-cases';

/** Addresses one equipment of a store. */
export interface EquipmentAddress {
  readonly storeId: string;
  readonly areaId: string;
  readonly equipmentId: string;
}

function keyOf(address: EquipmentAddress): string {
  return `${address.storeId}|${address.areaId}|${address.equipmentId}`;
}

/** Equipment setup: sensor binding (US16), thresholds (US18) and shutdown protocol (US12). */
@Injectable({ providedIn: 'root' })
export class EquipmentSetupStore {
  private readonly getEquipmentUseCase = inject(GetEquipmentUseCase);
  private readonly getBindingUseCase = inject(GetEquipmentDeviceBindingUseCase);
  private readonly bindUseCase = inject(BindEquipmentDeviceUseCase);
  private readonly getThresholdsUseCase = inject(GetEquipmentThresholdUseCase);
  private readonly updateThresholdsUseCase = inject(UpdateEquipmentThresholdUseCase);
  private readonly getProtocolUseCase = inject(GetShutdownProtocolUseCase);
  private readonly updateProtocolUseCase = inject(UpdateShutdownProtocolUseCase);

  readonly equipment = new AsyncResource<Equipment>();
  readonly binding = new AsyncResource<DeviceBinding | null>();
  readonly thresholds = new AsyncResource<ElectricalThresholds>();
  readonly protocol = new AsyncResource<ShutdownProtocol>();
  readonly bindState = new MutationState();
  readonly thresholdsState = new MutationState();
  readonly protocolState = new MutationState();

  load(address: EquipmentAddress): void {
    const { storeId, areaId, equipmentId } = address;
    const key = keyOf(address);
    this.bindState.clear();
    this.thresholdsState.clear();
    this.protocolState.clear();
    this.equipment.load(key, this.getEquipmentUseCase.execute(storeId, areaId, equipmentId));
    this.loadBinding(address);
    this.thresholds.load(key, this.getThresholdsUseCase.execute(storeId, areaId, equipmentId));
    this.protocol.load(key, this.getProtocolUseCase.execute(storeId, areaId, equipmentId));
  }

  loadBinding(address: EquipmentAddress): void {
    this.binding.load(
      keyOf(address),
      this.getBindingUseCase.execute(address.storeId, address.areaId, address.equipmentId),
    );
  }

  /** Binds permanently. A `409` means a binding already exists: the binding is reloaded. */
  bind(address: EquipmentAddress, deviceId: string, edgeDeviceId: string, onDone: () => void): void {
    this.bindState.run(
      this.bindUseCase.execute(address.storeId, address.areaId, address.equipmentId, deviceId, edgeDeviceId),
      (binding) => {
        this.binding.accept(keyOf(address), binding);
        onDone();
      },
      (error) => {
        if (error.status === 409) {
          this.loadBinding(address);
        }
      },
    );
  }

  saveThresholds(address: EquipmentAddress, thresholds: ElectricalThresholds): void {
    this.thresholdsState.run(
      this.updateThresholdsUseCase.execute(address.storeId, address.areaId, address.equipmentId, thresholds),
      (saved) => this.thresholds.accept(keyOf(address), saved),
    );
  }

  saveProtocol(
    address: EquipmentAddress,
    protocol: { shutdownSteps: string[]; emergencyIsolationSteps: string[]; safeToCleanRule: SafeToCleanRule },
  ): void {
    this.protocolState.run(
      this.updateProtocolUseCase.execute(address.storeId, address.areaId, address.equipmentId, protocol),
      (saved) => this.protocol.accept(keyOf(address), saved),
    );
  }
}
