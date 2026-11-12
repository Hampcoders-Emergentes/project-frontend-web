import { inject, Injectable } from '@angular/core';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import { layoutChanges, type StoreLayout } from '@stores/domain/model/store-layout';
import {
  GetStoreLayoutUseCase,
  UpdateStoreLayoutUseCase,
} from '@stores/application/use-cases/equipment-safety-use-cases';

/** Floor-plan layout of the active store (US39); saves are last-write-wins and followed by a reload. */
@Injectable({ providedIn: 'root' })
export class StoreLayoutStore {
  private readonly getLayoutUseCase = inject(GetStoreLayoutUseCase);
  private readonly updateLayoutUseCase = inject(UpdateStoreLayoutUseCase);

  readonly layout = new AsyncResource<StoreLayout>();
  readonly saveState = new MutationState();

  load(storeId: string): void {
    this.saveState.clear();
    this.layout.load(storeId, this.getLayoutUseCase.execute(storeId));
  }

  save(storeId: string, edited: StoreLayout): void {
    const original = this.layout.data();
    if (original === null) {
      return;
    }
    this.saveState.run(
      this.updateLayoutUseCase.execute(storeId, layoutChanges(original, edited)),
      (saved) => this.layout.accept(storeId, saved),
      (error) => {
        if (error.status === 409) {
          this.load(storeId);
        }
      },
    );
  }
}
