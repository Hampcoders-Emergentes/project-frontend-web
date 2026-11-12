import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AlertEquipmentDirectoryPort } from '@alerts/application/ports/alert-equipment-directory.port';
import { AnalyticsEquipmentPort } from '@analytics/application/ports/analytics-equipment.port';
import { ComplianceEquipmentPort } from '@compliance/application/ports/compliance-equipment.port';
import { EquipmentCatalogFacade } from '@stores/application/facades/equipment-catalog.facade';
import {
  EquipmentSafetyPort,
  ShiftRosterPort,
  StoreChannelPort,
  StoreDirectoryPort,
  StoreHierarchyPort,
  StoreLayoutPort,
} from '@stores/application/ports/stores-ports';
import { StoresApi } from '@stores/infrastructure/api/stores-api';
import { StoreChannelAdapter } from '@stores/infrastructure/realtime/store-channel.adapter';

/**
 * Binds the stores ports to their adapters, and the narrow equipment ports of the consuming contexts
 * (alerts, analytics, compliance) to the stores-owned `EquipmentCatalogFacade`.
 */
export function provideStores(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: StoreDirectoryPort, useExisting: StoresApi },
    { provide: StoreHierarchyPort, useExisting: StoresApi },
    { provide: EquipmentSafetyPort, useExisting: StoresApi },
    { provide: StoreLayoutPort, useExisting: StoresApi },
    { provide: ShiftRosterPort, useExisting: StoresApi },
    { provide: StoreChannelPort, useExisting: StoreChannelAdapter },
    { provide: AlertEquipmentDirectoryPort, useExisting: EquipmentCatalogFacade },
    { provide: AnalyticsEquipmentPort, useExisting: EquipmentCatalogFacade },
    { provide: ComplianceEquipmentPort, useExisting: EquipmentCatalogFacade },
  ]);
}
