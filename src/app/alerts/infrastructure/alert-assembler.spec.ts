import { type AlertResponse, toAlert, toAlertChanges } from '@alerts/infrastructure/alert-assembler';

/** A response as documented in alert-management/endpoints.md, plus an additive field added later. */
function alertResponse(overrides: Partial<AlertResponse> = {}): AlertResponse & { futureField: string } {
  return {
    id: 'alert-9f2c',
    equipmentId: 'equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9',
    anomalyType: 'CURRENT_LEAKAGE',
    detectionSeverity: 'string',
    severity: 'CRITICAL',
    capturedAtUtc: '2026-03-14T15:30:00Z',
    createdAtUtc: '2026-03-14T15:30:00Z',
    status: 'ACKNOWLEDGED',
    acknowledgedAtUtc: '2026-03-14T15:45:00Z',
    isCriticalLeakage: true,
    source: 'EdgeDevice',
    reportCategory: null,
    description: null,
    reportedBy: null,
    onDutyWorker: { workerCode: 'W-014', workerName: 'Carlos Ruiz' },
    assignedTechnicianId: null,
    assignedTechnicianName: null,
    assignedAtUtc: null,
    resolvedAtUtc: null,
    resolutionNotes: null,
    sequence: 43,
    futureField: 'added by a later API version',
    ...overrides,
  };
}

describe('alert assembler (tolerant reader)', () => {
  it('maps the documented fields and the change sequence', () => {
    const alert = toAlert(alertResponse());
    expect(alert.id).toBe('alert-9f2c');
    expect(alert.status).toBe('ACKNOWLEDGED');
    expect(alert.severity).toBe('CRITICAL');
    expect(alert.sequence).toBe(43);
    expect(alert.acknowledgedAt?.toISOString()).toBe('2026-03-14T15:45:00.000Z');
  });

  it('ignores unknown additive fields', () => {
    const alert = toAlert(alertResponse());
    expect(alert).not.toHaveProperty('futureField');
  });

  it('treats an alert without a sequence (changed before sequencing) as sequence 0', () => {
    const { sequence: _omitted, ...withoutSequence } = alertResponse();
    expect(toAlert(withoutSequence).sequence).toBe(0);
  });

  it('treats an unknown status as open, so it still needs attention', () => {
    expect(toAlert(alertResponse({ status: 'SOMETHING_NEW' })).status).toBe('OPEN');
  });

  it('maps one page of changes with its cursor and paging flag', () => {
    const page = toAlertChanges({
      items: [alertResponse({ id: 'alert-a11d', sequence: 44, status: 'OPEN', severity: 'NON_CRITICAL' })],
      latestSequence: 44,
      hasMore: true,
    });
    expect(page.latestSequence).toBe(44);
    expect(page.hasMore).toBe(true);
    expect(page.items[0]?.sequence).toBe(44);
  });
});
