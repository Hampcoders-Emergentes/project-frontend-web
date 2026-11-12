import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import { toAppError } from '@shared/application/app-error';
import type { Page, PageQuery } from '@shared/application/page';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { toIsoInstant } from '@shared/infrastructure/api/date-serialization';
import { type HasMorePageResponse, type PagedResponse, toPage } from '@shared/infrastructure/api/paging';
import type {
  ElectricalThresholds,
  SafeToCleanRule,
  ShutdownProtocol,
} from '@stores/domain/model/equipment-safety';
import type { OnDutyStaff, ShiftAssignment, ShiftDraft } from '@stores/domain/model/shift-roster';
import type { Area, DeviceBinding, Equipment, Store } from '@stores/domain/model/store-hierarchy';
import type { LayoutChanges, StoreLayout } from '@stores/domain/model/store-layout';
import type {
  EquipmentSafetyPort,
  ShiftRosterPort,
  StoreDirectoryPort,
  StoreHierarchyPort,
  StoreLayoutPort,
} from '@stores/application/ports/stores-ports';
import { StoresAssembler } from '@stores/infrastructure/api/stores-assembler';
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
  UpdateShutdownProtocolRequest,
  UpdateStoreLayoutRequest,
} from '@stores/infrastructure/api/stores-resources';

/**
 * StoresApi implements the stores ports against `/stores/...` (store management). Request bodies
 * carry exactly the documented fields: those endpoints reject unknown properties.
 */
@Injectable({ providedIn: 'root' })
export class StoresApi
  implements StoreDirectoryPort, StoreHierarchyPort, EquipmentSafetyPort, StoreLayoutPort, ShiftRosterPort
{
  private readonly api = inject(ApiClient);

  // ---- Directory
  listStores(query: PageQuery): Observable<Page<Store>> {
    return this.api
      .get<HasMorePageResponse<StoreResponse>>('/stores', { page: query.page, pageSize: query.pageSize })
      .pipe(map((page) => toPage(page, StoresAssembler.toStore)));
  }

  getStore(storeId: string): Observable<Store> {
    return this.api.get<StoreResponse>(apiPath('stores', storeId)).pipe(map(StoresAssembler.toStore));
  }

  /** `POST /stores` does not support `Idempotency-Key`; the UI disables submit while in flight. */
  createStore(name: string, address: string): Observable<Store> {
    return this.api.post<StoreResponse>('/stores', { name, address }).pipe(map(StoresAssembler.toStore));
  }

  // ---- Hierarchy
  listAreas(storeId: string, query: PageQuery): Observable<Page<Area>> {
    return this.api
      .get<HasMorePageResponse<AreaResponse>>(apiPath('stores', storeId, 'areas'), { ...query })
      .pipe(map((page) => toPage(page, StoresAssembler.toArea)));
  }

  createArea(storeId: string, name: string): Observable<Area> {
    return this.api.post<AreaResponse>(apiPath('stores', storeId, 'areas'), { name }).pipe(map(StoresAssembler.toArea));
  }

  listEquipment(storeId: string, areaId: string, query: PageQuery): Observable<Page<Equipment>> {
    return this.api
      .get<HasMorePageResponse<EquipmentResponse>>(apiPath('stores', storeId, 'areas', areaId, 'equipment'), { ...query })
      .pipe(map((page) => toPage(page, StoresAssembler.toEquipment)));
  }

  getEquipment(storeId: string, areaId: string, equipmentId: string): Observable<Equipment> {
    return this.api
      .get<EquipmentResponse>(apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId))
      .pipe(map(StoresAssembler.toEquipment));
  }

  createEquipment(storeId: string, areaId: string, name: string): Observable<Equipment> {
    return this.api
      .post<EquipmentResponse>(apiPath('stores', storeId, 'areas', areaId, 'equipment'), { name })
      .pipe(map(StoresAssembler.toEquipment));
  }

  getBinding(storeId: string, areaId: string, equipmentId: string): Observable<DeviceBinding | null> {
    return this.api
      .get<DeviceBindingResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'device-binding'))
      .pipe(
        map(StoresAssembler.toBinding),
        // The equipment was already loaded, so a 404 here means "no sensor linked yet".
        catchError((error: unknown) => (toAppError(error).status === 404 ? of(null) : throwError(() => error))),
      );
  }

  bindDevice(storeId: string, areaId: string, equipmentId: string, deviceId: string, edgeDeviceId: string): Observable<DeviceBinding> {
    return this.api
      .post<DeviceBindingResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'device-binding'), { deviceId, edgeDeviceId })
      .pipe(map(StoresAssembler.toBinding));
  }

  // ---- Safety configuration
  getThresholds(storeId: string, areaId: string, equipmentId: string): Observable<ElectricalThresholds> {
    return this.api
      .get<EquipmentThresholdsResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'thresholds'))
      .pipe(map(StoresAssembler.toThresholds));
  }

  updateThresholds(storeId: string, areaId: string, equipmentId: string, thresholds: ElectricalThresholds): Observable<ElectricalThresholds> {
    const body: EquipmentThresholdsResponse = { ...thresholds };
    return this.api
      .put<EquipmentThresholdsResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'thresholds'), body)
      .pipe(map(StoresAssembler.toThresholds));
  }

  getShutdownProtocol(storeId: string, areaId: string, equipmentId: string): Observable<ShutdownProtocol> {
    return this.api
      .get<ShutdownProtocolResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'shutdown-protocol'))
      .pipe(map(StoresAssembler.toProtocol));
  }

  updateShutdownProtocol(
    storeId: string,
    areaId: string,
    equipmentId: string,
    protocol: { shutdownSteps: readonly string[]; emergencyIsolationSteps: readonly string[]; safeToCleanRule: SafeToCleanRule },
  ): Observable<ShutdownProtocol> {
    const body: UpdateShutdownProtocolRequest = {
      shutdownSteps: [...protocol.shutdownSteps],
      emergencyIsolationSteps: [...protocol.emergencyIsolationSteps],
      isSafeToCleanRule: { ...protocol.safeToCleanRule },
    };
    return this.api
      .put<ShutdownProtocolResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'shutdown-protocol'), body)
      .pipe(map(StoresAssembler.toProtocol));
  }

  // ---- Layout
  getLayout(storeId: string): Observable<StoreLayout> {
    return this.api.get<StoreLayoutResponse>(apiPath('stores', storeId, 'layout')).pipe(map(StoresAssembler.toLayout));
  }

  updateLayout(storeId: string, changes: LayoutChanges): Observable<StoreLayout> {
    const body: UpdateStoreLayoutRequest = {
      canvasWidth: changes.canvasWidth,
      canvasHeight: changes.canvasHeight,
      items: changes.placements.map(({ equipmentId, box }) => ({
        equipmentId,
        coordinateX: box.x,
        coordinateY: box.y,
        width: box.width,
        height: box.height,
        zIndex: box.zIndex,
      })),
      removeEquipmentIds: [...changes.removedEquipmentIds],
    };
    return this.api.put<StoreLayoutResponse>(apiPath('stores', storeId, 'layout'), body).pipe(map(StoresAssembler.toLayout));
  }

  // ---- Shift roster
  listAssignments(storeId: string, from: Date, to: Date, query: PageQuery): Observable<Page<ShiftAssignment>> {
    return this.api
      .get<PagedResponse<StaffShiftResponse>>(apiPath('stores', storeId, 'shifts', 'assignments'), {
        from: toIsoInstant(from),
        to: toIsoInstant(to),
        page: query.page,
        pageSize: query.pageSize,
      })
      .pipe(map((page) => toPage(page, StoresAssembler.toShift)));
  }

  scheduleShift(storeId: string, draft: ShiftDraft): Observable<ShiftAssignment> {
    return this.api
      .post<StaffShiftResponse>(apiPath('stores', storeId, 'shifts', 'assignments'), {
        workerCode: draft.workerCode,
        workerName: draft.workerName,
        role: draft.role,
        startsAt: toIsoInstant(draft.startsAt),
        endsAt: toIsoInstant(draft.endsAt),
      })
      .pipe(map(StoresAssembler.toShift));
  }

  removeShift(storeId: string, shiftId: string): Observable<void> {
    return this.api.delete(apiPath('stores', storeId, 'shifts', 'assignments', shiftId));
  }

  getOnDuty(storeId: string): Observable<OnDutyStaff> {
    return this.api.get<OnDutyStaffResponse>(apiPath('stores', storeId, 'shifts', 'on-duty')).pipe(map(StoresAssembler.toOnDuty));
  }

  private equipmentPath(storeId: string, areaId: string, equipmentId: string, resource: string): string {
    return apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId, resource);
  }
}
