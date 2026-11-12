import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { ActiveAlerts, Alert, AlertChanges } from '@alerts/domain/model/alert';
import { AlertsPort } from '@alerts/application/ports/alerts.port';
import { SyncActiveAlertsUseCase } from '@alerts/application/use-cases/alert-use-cases';

function alert(id: string, sequence: number): Alert {
  return {
    id,
    equipmentId: 'equipment-1',
    anomalyType: 'CURRENT_LEAKAGE',
    severity: 'NON_CRITICAL',
    detectionSeverity: 'string',
    status: 'OPEN',
    source: 'TELEMETRY',
    capturedAt: new Date('2026-03-14T15:30:00Z'),
    createdAt: new Date('2026-03-14T15:30:00Z'),
    isCriticalLeakage: false,
    reportCategory: null,
    description: null,
    reportedBy: null,
    onDutyWorker: null,
    acknowledgedAt: null,
    assignedTechnicianId: null,
    assignedTechnicianName: null,
    assignedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
    sequence,
  };
}

const current: ActiveAlerts = {
  generatedAt: new Date('2026-03-14T15:00:00Z'),
  openCritical: 1,
  openNonCritical: 1,
  hasCriticalLeakage: true,
  latestSequence: 10,
  items: [alert('a1', 10)],
};

describe('SyncActiveAlertsUseCase', () => {
  let port: {
    getActive: ReturnType<typeof vi.fn>;
    getChanges: ReturnType<typeof vi.fn>;
  };
  let sync: SyncActiveAlertsUseCase;

  beforeEach(() => {
    port = { getActive: vi.fn(), getChanges: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: AlertsPort, useValue: port }] });
    sync = TestBed.inject(SyncActiveAlertsUseCase);
  });

  it('reads the full list on the first load', () => {
    port.getActive.mockReturnValue(of(current));
    sync.execute('store-1', null).subscribe();
    expect(port.getActive).toHaveBeenCalledWith('store-1');
    expect(port.getChanges).not.toHaveBeenCalled();
  });

  it('reads only the changes after the cursor and merges them', () => {
    port.getChanges.mockReturnValue(
      of<AlertChanges>({ items: [alert('a2', 11)], latestSequence: 11, hasMore: false }),
    );
    let result: ActiveAlerts | undefined;
    sync.execute('store-1', current).subscribe((value) => (result = value));
    expect(port.getChanges).toHaveBeenCalledWith('store-1', 10);
    expect(port.getActive).not.toHaveBeenCalled();
    expect(result?.items.map((item) => item.id)).toEqual(['a2', 'a1']);
    expect(result?.latestSequence).toBe(11);
  });

  it('follows pages while hasMore is true', () => {
    port.getChanges
      .mockReturnValueOnce(of<AlertChanges>({ items: [alert('a2', 11)], latestSequence: 11, hasMore: true }))
      .mockReturnValueOnce(of<AlertChanges>({ items: [alert('a3', 12)], latestSequence: 12, hasMore: false }));
    let result: ActiveAlerts | undefined;
    sync.execute('store-1', current).subscribe((value) => (result = value));
    expect(port.getChanges).toHaveBeenNthCalledWith(2, 'store-1', 11);
    expect(result?.items.map((item) => item.id)).toEqual(['a3', 'a2', 'a1']);
    expect(result?.latestSequence).toBe(12);
  });

  it('reads the full list when the server does not know the cursor', () => {
    port.getChanges.mockReturnValue(of<AlertChanges>({ items: [], latestSequence: 3, hasMore: false }));
    port.getActive.mockReturnValue(of(current));
    sync.execute('store-1', current).subscribe();
    expect(port.getActive).toHaveBeenCalledWith('store-1');
  });
});
