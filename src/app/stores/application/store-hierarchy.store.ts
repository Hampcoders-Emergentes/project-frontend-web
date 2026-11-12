import { inject, Injectable } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import type { Area, Equipment } from '@stores/domain/model/store-hierarchy';
import {
  CreateAreaUseCase,
  CreateEquipmentUseCase,
  ListAreasUseCase,
  ListEquipmentUseCase,
} from '@stores/application/use-cases/store-hierarchy-use-cases';

/** An area with its equipment. */
export interface AreaNode {
  readonly area: Area;
  readonly equipment: readonly Equipment[];
}

/** The store -> area -> equipment tree of the active store (US08 setup). */
@Injectable({ providedIn: 'root' })
export class StoreHierarchyStore {
  private readonly listAreasUseCase = inject(ListAreasUseCase);
  private readonly listEquipmentUseCase = inject(ListEquipmentUseCase);
  private readonly createAreaUseCase = inject(CreateAreaUseCase);
  private readonly createEquipmentUseCase = inject(CreateEquipmentUseCase);

  readonly tree = new AsyncResource<readonly AreaNode[]>();
  readonly createAreaState = new MutationState();
  readonly createEquipmentState = new MutationState();

  load(storeId: string): void {
    this.tree.load(
      storeId,
      this.listAreasUseCase.execute(storeId).pipe(
        switchMap((areas) =>
          areas.length === 0
            ? of([])
            : forkJoin(
                areas.map((area) =>
                  this.listEquipmentUseCase.execute(storeId, area.id).pipe(map((equipment) => ({ area, equipment }))),
                ),
              ),
        ),
      ),
    );
  }

  createArea(storeId: string, name: string, onCreated: () => void): void {
    this.createAreaState.run(this.createAreaUseCase.execute(storeId, name), (area) => {
      this.tree.patch((nodes) => [...nodes, { area, equipment: [] }]);
      onCreated();
    });
  }

  createEquipment(storeId: string, areaId: string, name: string, onCreated: () => void): void {
    this.createEquipmentState.run(this.createEquipmentUseCase.execute(storeId, areaId, name), (equipment) => {
      this.tree.patch((nodes) =>
        nodes.map((node) => (node.area.id === areaId ? { ...node, equipment: [...node.equipment, equipment] } : node)),
      );
      onCreated();
    });
  }
}
