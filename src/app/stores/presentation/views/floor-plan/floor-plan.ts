import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreLayoutStore } from '@stores/application/store-layout.store';
import {
  clampToCanvas,
  DEFAULT_PLACEMENT_SIZE,
  type EquipmentPlacement,
  type LayoutRiskLevel,
  type PlacementBox,
  type StoreLayout,
} from '@stores/domain/model/store-layout';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag, type StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const RISK_APPEARANCE: Readonly<Record<LayoutRiskLevel, StatusAppearance>> = {
  SAFE: { tone: 'success', icon: 'circle-check' },
  WARNING: { tone: 'warning', icon: 'alert-triangle' },
  CRITICAL_RISK: { tone: 'critical', icon: 'alert-octagon' },
  DISCONNECTED: { tone: 'neutral', icon: 'wifi-off' },
  UNKNOWN: { tone: 'neutral', icon: 'info-circle' },
};

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;
type BoxField = keyof PlacementBox;

interface DragState {
  readonly equipmentId: string;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly box: PlacementBox;
}

/**
 * Interactive 2D floor-plan editor (US39). Equipment can be moved by dragging, by arrow keys on the
 * selected item (Shift = fine steps) or by typing coordinates; the canvas scrolls and zooms so it stays
 * usable at laptop widths. Saving sends the full layout (last write wins) and reloads it.
 */
@Component({
  imports: [TranslatePipe, ErrorNotice, StatePanel, StatusTag],
  selector: 'app-floor-plan-view',
  styleUrl: './floor-plan.css',
  templateUrl: './floor-plan.html',
})
export class FloorPlanView {
  readonly storeId = input.required<string>();
  protected readonly layoutStore = inject(StoreLayoutStore);
  protected readonly resource = this.layoutStore.layout;
  protected readonly edited = signal<StoreLayout | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly zoomIndex = signal(2);
  protected readonly zoom = computed(() => ZOOM_LEVELS[this.zoomIndex()] ?? 1);
  protected readonly dirty = signal(false);
  protected readonly boxFields: readonly BoxField[] = ['x', 'y', 'width', 'height', 'zIndex'];
  private drag: DragState | null = null;

  protected readonly placed = computed(() => this.edited()?.equipment.filter((item) => item.box !== null) ?? []);
  protected readonly unplaced = computed(() => this.edited()?.equipment.filter((item) => item.box === null) ?? []);
  protected readonly selected = computed(
    () => this.edited()?.equipment.find((item) => item.equipmentId === this.selectedId()) ?? null,
  );

  constructor() {
    whenChanged(this.storeId, (storeId) => this.layoutStore.load(storeId));
    effect(() => {
      this.edited.set(this.resource.data());
      this.dirty.set(false);
    });
    redirectOnStoreNotFound(this.resource.error);
  }

  protected appearance(level: LayoutRiskLevel): StatusAppearance {
    return RISK_APPEARANCE[level];
  }

  protected setZoom(offset: -1 | 1): void {
    this.zoomIndex.update((index) => Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index + offset)));
  }

  protected place(item: EquipmentPlacement): void {
    const layout = this.edited();
    if (layout === null) {
      return;
    }
    const offset = (this.placed().length % 8) * 20;
    this.updateBox(item.equipmentId, { x: offset, y: offset, ...DEFAULT_PLACEMENT_SIZE, zIndex: this.placed().length });
    this.selectedId.set(item.equipmentId);
  }

  protected unplace(equipmentId: string): void {
    this.mutate(equipmentId, () => null);
    this.selectedId.set(null);
  }

  protected setBoxField(field: BoxField, event: Event): void {
    const item = this.selected();
    const value = Number((event.target as HTMLInputElement).value);
    if (item?.box && Number.isFinite(value)) {
      this.updateBox(item.equipmentId, { ...item.box, [field]: value });
    }
  }

  protected onKeydown(event: KeyboardEvent, item: EquipmentPlacement): void {
    const step = event.shiftKey ? 1 : 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move && item.box) {
      event.preventDefault();
      this.updateBox(item.equipmentId, { ...item.box, x: item.box.x + move[0], y: item.box.y + move[1] });
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.unplace(item.equipmentId);
    }
  }

  protected onPointerDown(event: PointerEvent, item: EquipmentPlacement): void {
    if (!item.box) {
      return;
    }
    this.selectedId.set(item.equipmentId);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.drag = { equipmentId: item.equipmentId, pointerX: event.clientX, pointerY: event.clientY, box: item.box };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.drag === null) {
      return;
    }
    const scale = this.zoom();
    this.updateBox(this.drag.equipmentId, {
      ...this.drag.box,
      x: this.drag.box.x + (event.clientX - this.drag.pointerX) / scale,
      y: this.drag.box.y + (event.clientY - this.drag.pointerY) / scale,
    });
  }

  protected onPointerUp(): void {
    this.drag = null;
  }

  protected save(): void {
    const layout = this.edited();
    if (layout !== null) {
      this.layoutStore.save(this.storeId(), layout);
    }
  }

  protected discard(): void {
    this.edited.set(this.resource.data());
    this.dirty.set(false);
  }

  private updateBox(equipmentId: string, box: PlacementBox): void {
    const layout = this.edited();
    if (layout !== null) {
      this.mutate(equipmentId, () => clampToCanvas(box, layout.canvasWidth, layout.canvasHeight));
    }
  }

  private mutate(equipmentId: string, next: (box: PlacementBox | null) => PlacementBox | null): void {
    this.edited.update((layout) =>
      layout === null
        ? layout
        : {
            ...layout,
            equipment: layout.equipment.map((item) =>
              item.equipmentId === equipmentId ? { ...item, box: next(item.box) } : item,
            ),
          },
    );
    this.dirty.set(true);
  }
}
