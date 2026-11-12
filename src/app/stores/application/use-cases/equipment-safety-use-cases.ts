import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ElectricalThresholds,
  SafeToCleanRule,
  ShutdownProtocol,
} from '@stores/domain/model/equipment-safety';
import type { LayoutChanges, StoreLayout } from '@stores/domain/model/store-layout';
import type { OnDutyStaff, ShiftAssignment, ShiftDraft } from '@stores/domain/model/shift-roster';
import type { Page } from '@shared/application/page';
import {
  EquipmentSafetyPort,
  ShiftRosterPort,
  StoreLayoutPort,
} from '@stores/application/ports/stores-ports';

@Injectable({ providedIn: 'root' })
export class GetEquipmentThresholdUseCase {
  private readonly safety = inject(EquipmentSafetyPort);

  execute(storeId: string, areaId: string, equipmentId: string): Observable<ElectricalThresholds> {
    return this.safety.getThresholds(storeId, areaId, equipmentId);
  }
}

/** Sends all eight threshold values (full-body `PUT`). */
@Injectable({ providedIn: 'root' })
export class UpdateEquipmentThresholdUseCase {
  private readonly safety = inject(EquipmentSafetyPort);

  execute(storeId: string, areaId: string, equipmentId: string, thresholds: ElectricalThresholds): Observable<ElectricalThresholds> {
    return this.safety.updateThresholds(storeId, areaId, equipmentId, thresholds);
  }
}

@Injectable({ providedIn: 'root' })
export class GetShutdownProtocolUseCase {
  private readonly safety = inject(EquipmentSafetyPort);

  execute(storeId: string, areaId: string, equipmentId: string): Observable<ShutdownProtocol> {
    return this.safety.getShutdownProtocol(storeId, areaId, equipmentId);
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateShutdownProtocolUseCase {
  private readonly safety = inject(EquipmentSafetyPort);

  execute(
    storeId: string,
    areaId: string,
    equipmentId: string,
    protocol: { shutdownSteps: readonly string[]; emergencyIsolationSteps: readonly string[]; safeToCleanRule: SafeToCleanRule },
  ): Observable<ShutdownProtocol> {
    return this.safety.updateShutdownProtocol(storeId, areaId, equipmentId, {
      shutdownSteps: protocol.shutdownSteps.map((step) => step.trim()),
      emergencyIsolationSteps: protocol.emergencyIsolationSteps.map((step) => step.trim()),
      safeToCleanRule: protocol.safeToCleanRule,
    });
  }
}

@Injectable({ providedIn: 'root' })
export class GetStoreLayoutUseCase {
  private readonly layout = inject(StoreLayoutPort);

  execute(storeId: string): Observable<StoreLayout> {
    return this.layout.getLayout(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateStoreLayoutUseCase {
  private readonly layout = inject(StoreLayoutPort);

  execute(storeId: string, changes: LayoutChanges): Observable<StoreLayout> {
    return this.layout.updateLayout(storeId, changes);
  }
}

@Injectable({ providedIn: 'root' })
export class ListShiftAssignmentsUseCase {
  private readonly roster = inject(ShiftRosterPort);

  execute(storeId: string, from: Date, to: Date, page: number): Observable<Page<ShiftAssignment>> {
    return this.roster.listAssignments(storeId, from, to, { page, pageSize: 50 });
  }
}

@Injectable({ providedIn: 'root' })
export class ScheduleShiftUseCase {
  private readonly roster = inject(ShiftRosterPort);

  execute(storeId: string, draft: ShiftDraft): Observable<ShiftAssignment> {
    return this.roster.scheduleShift(storeId, {
      ...draft,
      workerCode: draft.workerCode.trim(),
      workerName: draft.workerName.trim(),
      role: draft.role.trim(),
    });
  }
}

@Injectable({ providedIn: 'root' })
export class RemoveShiftUseCase {
  private readonly roster = inject(ShiftRosterPort);

  execute(storeId: string, shiftId: string): Observable<void> {
    return this.roster.removeShift(storeId, shiftId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetOnDutyStaffUseCase {
  private readonly roster = inject(ShiftRosterPort);

  execute(storeId: string): Observable<OnDutyStaff> {
    return this.roster.getOnDuty(storeId);
  }
}
