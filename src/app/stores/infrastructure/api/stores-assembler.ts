import type { ElectricalThresholds, ShutdownProtocol } from '@stores/domain/model/equipment-safety';
import type { OnDutyStaff, ShiftAssignment } from '@stores/domain/model/shift-roster';
import type { Area, DeviceBinding, Equipment, Store } from '@stores/domain/model/store-hierarchy';
import { type StoreLayout, toLayoutRiskLevel } from '@stores/domain/model/store-layout';
import type {
  AreaResponse,
  DeviceBindingResponse,
  EquipmentResponse,
  EquipmentThresholdsResponse,
  OnDutyStaffResponse,
  ShutdownProtocolResponse,
  StaffShiftResponse,
  StoreLayoutResponse,
  StoreResponse,
} from '@stores/infrastructure/api/stores-resources';

/** Maps store-management resources to stores domain models. */
export const StoresAssembler = {
  toStore(resource: StoreResponse): Store {
    return {
      id: resource.id,
      name: resource.name,
      address: resource.address,
      lastEdgeSyncAt: resource.lastEdgeSyncAtUtc === null ? null : new Date(resource.lastEdgeSyncAtUtc),
    };
  },

  toArea(resource: AreaResponse): Area {
    return { id: resource.id, storeId: resource.storeId, name: resource.name };
  },

  toEquipment(resource: EquipmentResponse): Equipment {
    return { id: resource.id, areaId: resource.areaId, name: resource.name };
  },

  toBinding(resource: DeviceBindingResponse): DeviceBinding {
    return {
      id: resource.id,
      equipmentId: resource.equipmentId,
      deviceId: resource.deviceId,
      serialNumber: resource.serialNumber,
      edgeDeviceId: resource.edgeDeviceId,
      linkedAt: new Date(resource.linkedAtUtc),
    };
  },

  toThresholds(resource: EquipmentThresholdsResponse): ElectricalThresholds {
    return {
      nominalVoltage: resource.nominalVoltage,
      maxConsumptionWatts: resource.maxConsumptionWatts,
      maxCurrentAmps: resource.maxCurrentAmps,
      minPowerFactor: resource.minPowerFactor,
      nominalFrequency: resource.nominalFrequency,
      disconnectionThresholdMin: resource.disconnectionThresholdMin,
      normalLimitAmps: resource.normalLimitAmps,
      alertLimitAmps: resource.alertLimitAmps,
    };
  },

  toProtocol(resource: ShutdownProtocolResponse): ShutdownProtocol {
    return {
      equipmentId: resource.equipmentId,
      equipmentName: resource.name,
      isDefault: resource.isDefault,
      shutdownSteps: resource.shutdownSteps,
      emergencyIsolationSteps: resource.emergencyIsolationSteps,
      safeToCleanRule: { ...resource.isSafeToCleanRule },
      updatedAt: resource.updatedAtUtc === null ? null : new Date(resource.updatedAtUtc),
    };
  },

  toLayout(resource: StoreLayoutResponse): StoreLayout {
    return {
      canvasWidth: resource.canvasWidth,
      canvasHeight: resource.canvasHeight,
      equipment: resource.equipment.map((item) => ({
        equipmentId: item.equipmentId,
        name: item.name,
        areaId: item.areaId,
        areaName: item.areaName,
        riskLevel: toLayoutRiskLevel(item.riskLevel),
        box:
          item.isPlaced && item.coordinateX !== null && item.coordinateY !== null && item.width !== null && item.height !== null
            ? { x: item.coordinateX, y: item.coordinateY, width: item.width, height: item.height, zIndex: item.zIndex ?? 0 }
            : null,
      })),
    };
  },

  toShift(resource: StaffShiftResponse): ShiftAssignment {
    return {
      id: resource.id,
      workerCode: resource.workerCode,
      workerName: resource.workerName,
      role: resource.role,
      startsAt: new Date(resource.startsAtUtc),
      endsAt: new Date(resource.endsAtUtc),
      createdAt: new Date(resource.createdAtUtc),
    };
  },

  toOnDuty(resource: OnDutyStaffResponse): OnDutyStaff {
    return {
      at: new Date(resource.atUtc),
      accountable: resource.accountable === null ? null : StoresAssembler.toShift(resource.accountable),
      onDuty: resource.onDuty.map((shift) => StoresAssembler.toShift(shift)),
    };
  },
};
