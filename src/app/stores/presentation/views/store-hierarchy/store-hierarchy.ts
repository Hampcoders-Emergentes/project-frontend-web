import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreHierarchyStore } from '@stores/application/store-hierarchy.store';
import { StoreDirectoryStore } from '@stores/application/store-directory.store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Areas and equipment of a store: the store -> area -> equipment hierarchy (US08 setup). */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ErrorNotice, Icon, StatePanel],
  selector: 'app-store-hierarchy-view',
  templateUrl: './store-hierarchy.html',
})
export class StoreHierarchyView {
  readonly storeId = input.required<string>();
  protected readonly hierarchy = inject(StoreHierarchyStore);
  protected readonly directory = inject(StoreDirectoryStore);
  protected readonly tree = this.hierarchy.tree;
  /** The area whose "add equipment" form is open. */
  protected readonly addingToArea = signal<string | null>(null);

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly areaForm = this.fb.group({ name: ['', [Validators.required, Validators.pattern(/\S/)]] });
  protected readonly equipmentForm = this.fb.group({ name: ['', [Validators.required, Validators.pattern(/\S/)]] });

  constructor() {
    whenChanged(this.storeId, (storeId) => this.hierarchy.load(storeId));
    redirectOnStoreNotFound(this.tree.error);
  }

  protected createArea(): void {
    if (this.areaForm.invalid) {
      this.areaForm.markAllAsTouched();
      return;
    }
    this.hierarchy.createArea(this.storeId(), this.areaForm.getRawValue().name, () => this.areaForm.reset());
  }

  protected openEquipmentForm(areaId: string): void {
    this.equipmentForm.reset();
    this.hierarchy.createEquipmentState.clear();
    this.addingToArea.set(areaId);
  }

  protected createEquipment(areaId: string): void {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }
    this.hierarchy.createEquipment(this.storeId(), areaId, this.equipmentForm.getRawValue().name, () => {
      this.equipmentForm.reset();
      this.addingToArea.set(null);
    });
  }
}
