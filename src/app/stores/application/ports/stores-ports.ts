import type { Observable } from 'rxjs';
import type { Page, PageQuery } from '@shared/application/page';
import type {
  ElectricalThresholds,
  SafeToCleanRule,
  ShutdownProtocol,
} from '@stores/domain/model/equipment-safety';
import type { OnDutyStaff, ShiftAssignment, ShiftDraft } from '@stores/domain/model/shift-roster';
import type { Area, DeviceBinding, Equipment, Store } from '@stores/domain/model/store-hierarchy';
import type { LayoutChanges, StoreLayout } from '@stores/domain/model/store-layout';

/** Owned stores. A `404` means the store does not exist or is not owned by the caller. */
export abstract class StoreDirectoryPort {
  abstract listStores(query: PageQuery): Observable<Page<Store>>;
  abstract getStore(storeId: string): Observable<Store>;
  abstract createStore(name: string, address: string): Observable<Store>;
}

/** Areas, equipment and permanent sensor bindings of a store. */
export abstract class StoreHierarchyPort {
  abstract listAreas(storeId: string, query: PageQuery): Observable<Page<Area>>;
  abstract createArea(storeId: string, name: string): Observable<Area>;
  abstract listEquipment(storeId: string, areaId: string, query: PageQuery): Observable<Page<Equipment>>;
  abstract getEquipment(storeId: string, areaId: string, equipmentId: string): Observable<Equipment>;
  abstract createEquipment(storeId: string, areaId: string, name: string): Observable<Equipment>;
  /** Emits null when the equipment has no binding (`404`). */
  abstract getBinding(storeId: string, areaId: string, equipmentId: string): Observable<DeviceBinding | null>;
  abstract bindDevice(
    storeId: string,
    areaId: string,
    equipmentId: string,
    deviceId: string,
    edgeDeviceId: string,
  ): Observable<DeviceBinding>;
}

/** Electrical thresholds and shutdown protocol of an equipment (last-write-wins `PUT`s). */
export abstract class EquipmentSafetyPort {
  abstract getThresholds(storeId: string, areaId: string, equipmentId: string): Observable<ElectricalThresholds>;
  abstract updateThresholds(
    storeId: string,
    areaId: string,
    equipmentId: string,
    thresholds: ElectricalThresholds,
  ): Observable<ElectricalThresholds>;
  abstract getShutdownProtocol(storeId: string, areaId: string, equipmentId: string): Observable<ShutdownProtocol>;
  abstract updateShutdownProtocol(
    storeId: string,
    areaId: string,
    equipmentId: string,
    protocol: {
      readonly shutdownSteps: readonly string[];
      readonly emergencyIsolationSteps: readonly string[];
      readonly safeToCleanRule: SafeToCleanRule;
    },
  ): Observable<ShutdownProtocol>;
}

/** Floor-plan layout of a store. */
export abstract class StoreLayoutPort {
  abstract getLayout(storeId: string): Observable<StoreLayout>;
  abstract updateLayout(storeId: string, changes: LayoutChanges): Observable<StoreLayout>;
}

/** Shift roster and on-duty staff. */
export abstract class ShiftRosterPort {
  abstract listAssignments(storeId: string, from: Date, to: Date, query: PageQuery): Observable<Page<ShiftAssignment>>;
  abstract scheduleShift(storeId: string, draft: ShiftDraft): Observable<ShiftAssignment>;
  abstract removeShift(storeId: string, shiftId: string): Observable<void>;
  abstract getOnDuty(storeId: string): Observable<OnDutyStaff>;
}

/**
 * Store membership on the realtime channel (`JoinStore`/`LeaveStore`) and the store-owned events.
 * Joining fails like a `404` when the store is not owned.
 */
export abstract class StoreChannelPort {
  abstract join(storeId: string): Observable<void>;
  abstract leave(storeId: string): Observable<void>;
  /** Emits whenever a shift handover is announced for the joined store. */
  abstract readonly shiftHandovers$: Observable<void>;
  /** Emits after the realtime connection reconnected (events are not replayed). */
  abstract readonly reconnected$: Observable<void>;
}
