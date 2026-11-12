/** Risk level shown on the floor plan (worse = higher). */
export type LayoutRiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL_RISK' | 'DISCONNECTED' | 'UNKNOWN';

const RISK_LEVELS: readonly LayoutRiskLevel[] = ['SAFE', 'WARNING', 'CRITICAL_RISK', 'DISCONNECTED', 'UNKNOWN'];

/** Narrows an API risk string; anything unrecognized is `UNKNOWN`, never healthy. */
export function toLayoutRiskLevel(value: string): LayoutRiskLevel {
  return RISK_LEVELS.find((level) => level === value) ?? 'UNKNOWN';
}

/** Rectangle of a placed equipment on the canvas (canvas units). */
export interface PlacementBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly zIndex: number;
}

/** An equipment on the floor plan, placed or not. */
export interface EquipmentPlacement {
  readonly equipmentId: string;
  readonly name: string;
  readonly areaId: string;
  readonly areaName: string;
  readonly riskLevel: LayoutRiskLevel;
  readonly box: PlacementBox | null;
}

/** The floor-plan layout of a store (US39). */
export interface StoreLayout {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly equipment: readonly EquipmentPlacement[];
}

/** Default size of a newly placed equipment, in canvas units. */
export const DEFAULT_PLACEMENT_SIZE = { width: 120, height: 80 } as const;

/**
 * Keeps a box inside the canvas (positive size, fully visible).
 * @param box - The candidate box.
 * @param canvasWidth - Canvas width.
 * @param canvasHeight - Canvas height.
 */
export function clampToCanvas(box: PlacementBox, canvasWidth: number, canvasHeight: number): PlacementBox {
  const width = Math.max(1, Math.min(Math.round(box.width), canvasWidth));
  const height = Math.max(1, Math.min(Math.round(box.height), canvasHeight));
  return {
    width,
    height,
    x: Math.max(0, Math.min(Math.round(box.x), canvasWidth - width)),
    y: Math.max(0, Math.min(Math.round(box.y), canvasHeight - height)),
    zIndex: Math.max(0, Math.round(box.zIndex)),
  };
}

/** Changes to send: placed boxes plus equipment removed from the plan. */
export interface LayoutChanges {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly placements: readonly { readonly equipmentId: string; readonly box: PlacementBox }[];
  readonly removedEquipmentIds: readonly string[];
}

/**
 * Computes the full layout update (last-write-wins `PUT`) between the loaded and edited layouts.
 * @param original - The layout as loaded.
 * @param edited - The layout as edited.
 */
export function layoutChanges(original: StoreLayout, edited: StoreLayout): LayoutChanges {
  const wasPlaced = new Set(original.equipment.filter((item) => item.box !== null).map((item) => item.equipmentId));
  const placements = edited.equipment.flatMap((item) =>
    item.box === null ? [] : [{ equipmentId: item.equipmentId, box: item.box }],
  );
  const removedEquipmentIds = edited.equipment
    .filter((item) => item.box === null && wasPlaced.has(item.equipmentId))
    .map((item) => item.equipmentId);
  return { canvasWidth: edited.canvasWidth, canvasHeight: edited.canvasHeight, placements, removedEquipmentIds };
}
