import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import type { Page } from '@shared/application/page';
import type { OnDutyStaff, ShiftAssignment, ShiftDraft, ShiftHandoverNotice } from '@stores/domain/model/shift-roster';
import { StoreChannelPort } from '@stores/application/ports/stores-ports';
import {
  GetOnDutyStaffUseCase,
  ListShiftAssignmentsUseCase,
  RemoveShiftUseCase,
  ScheduleShiftUseCase,
} from '@stores/application/use-cases/equipment-safety-use-cases';

/** A roster query window. */
export interface RosterWindow {
  readonly from: Date;
  readonly to: Date;
  readonly page: number;
}

/** Shift roster and on-duty staff (US23, US35); reloads on-duty data on `ShiftHandover`. */
@Injectable({ providedIn: 'root' })
export class ShiftRosterStore {
  private readonly listUseCase = inject(ListShiftAssignmentsUseCase);
  private readonly scheduleUseCase = inject(ScheduleShiftUseCase);
  private readonly removeUseCase = inject(RemoveShiftUseCase);
  private readonly onDutyUseCase = inject(GetOnDutyStaffUseCase);

  readonly assignments = new AsyncResource<Page<ShiftAssignment>>();
  readonly onDuty = new AsyncResource<OnDutyStaff>();
  readonly scheduleState = new MutationState();
  readonly removeState = new MutationState();
  private readonly handoverSignal = signal<ShiftHandoverNotice | null>(null);
  readonly lastHandover = this.handoverSignal.asReadonly();

  private storeId: string | null = null;
  private window: RosterWindow | null = null;

  constructor() {
    const channel = inject(StoreChannelPort);
    merge(channel.shiftHandovers$, channel.reconnected$)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        if (this.storeId !== null) {
          this.handoverSignal.set({ receivedAt: new Date() });
          this.loadOnDuty(this.storeId);
        }
      });
  }

  loadOnDuty(storeId: string): void {
    this.storeId = storeId;
    this.onDuty.load(storeId, this.onDutyUseCase.execute(storeId));
  }

  loadAssignments(storeId: string, window: RosterWindow): void {
    this.storeId = storeId;
    this.window = window;
    this.assignments.load(
      `${storeId}|${window.from.toISOString()}|${window.to.toISOString()}|${window.page}`,
      this.listUseCase.execute(storeId, window.from, window.to, window.page),
    );
  }

  schedule(storeId: string, draft: ShiftDraft, onDone: () => void): void {
    this.scheduleState.run(this.scheduleUseCase.execute(storeId, draft), () => {
      this.reload(storeId);
      onDone();
    });
  }

  remove(storeId: string, shiftId: string): void {
    this.removeState.run(
      this.removeUseCase.execute(storeId, shiftId),
      () => this.reload(storeId),
      (error) => {
        if (error.status === 404 || error.status === 409) {
          this.reload(storeId);
        }
      },
    );
  }

  private reload(storeId: string): void {
    this.loadOnDuty(storeId);
    if (this.window !== null) {
      this.loadAssignments(storeId, this.window);
    }
  }
}
