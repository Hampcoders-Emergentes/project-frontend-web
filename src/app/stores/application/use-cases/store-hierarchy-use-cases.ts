import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, forkJoin, map, mergeMap, type Observable, of, reduce } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { Area, DeviceBinding, Equipment, EquipmentLocation } from '@stores/domain/model/store-hierarchy';
import { StoreHierarchyPort } from '@stores/application/ports/stores-ports';

const PAGE_SIZE = 100;

/** Reads every page of a has-more list. */
function allPages<T>(load: (page: number) => Observable<Page<T>>): Observable<T[]> {
  return load(1).pipe(
    expand((page) => (page.hasMore ? load(page.page + 1) : EMPTY)),
    reduce<Page<T>, T[]>((items, page) => [...items, ...page.items], []),
  );
}

/** Lists every area of a store. */
@Injectable({ providedIn: 'root' })
export class ListAreasUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string): Observable<Area[]> {
    return allPages((page) => this.hierarchy.listAreas(storeId, { page, pageSize: PAGE_SIZE }));
  }
}

@Injectable({ providedIn: 'root' })
export class CreateAreaUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string, name: string): Observable<Area> {
    return this.hierarchy.createArea(storeId, name.trim());
  }
}

/** Lists every equipment of an area. */
@Injectable({ providedIn: 'root' })
export class ListEquipmentUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string, areaId: string): Observable<Equipment[]> {
    return allPages((page) => this.hierarchy.listEquipment(storeId, areaId, { page, pageSize: PAGE_SIZE }));
  }
}

@Injectable({ providedIn: 'root' })
export class CreateEquipmentUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string, areaId: string, name: string): Observable<Equipment> {
    return this.hierarchy.createEquipment(storeId, areaId, name.trim());
  }
}

@Injectable({ providedIn: 'root' })
export class GetEquipmentUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string, areaId: string, equipmentId: string): Observable<Equipment> {
    return this.hierarchy.getEquipment(storeId, areaId, equipmentId);
  }
}

/** The whole store -> area -> equipment tree, flattened to equipment locations. */
@Injectable({ providedIn: 'root' })
export class LoadEquipmentCatalogUseCase {
  private readonly listAreas = inject(ListAreasUseCase);
  private readonly listEquipment = inject(ListEquipmentUseCase);

  execute(storeId: string): Observable<EquipmentLocation[]> {
    return this.listAreas.execute(storeId).pipe(
      mergeMap((areas) =>
        areas.length === 0
          ? of([] as EquipmentLocation[][])
          : forkJoin(
              areas.map((area) =>
                this.listEquipment.execute(storeId, area.id).pipe(
                  map((equipment) =>
                    equipment.map((item) => ({
                      equipmentId: item.id,
                      equipmentName: item.name,
                      areaId: area.id,
                      areaName: area.name,
                    })),
                  ),
                ),
              ),
            ),
      ),
      map((groups) => groups.flat()),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class GetEquipmentDeviceBindingUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(storeId: string, areaId: string, equipmentId: string): Observable<DeviceBinding | null> {
    return this.hierarchy.getBinding(storeId, areaId, equipmentId);
  }
}

/** Links a sensor permanently (no unbind exists); the UI confirms before calling it. */
@Injectable({ providedIn: 'root' })
export class BindEquipmentDeviceUseCase {
  private readonly hierarchy = inject(StoreHierarchyPort);

  execute(
    storeId: string,
    areaId: string,
    equipmentId: string,
    deviceId: string,
    edgeDeviceId: string,
  ): Observable<DeviceBinding> {
    return this.hierarchy.bindDevice(storeId, areaId, equipmentId, deviceId.trim(), edgeDeviceId.trim());
  }
}
