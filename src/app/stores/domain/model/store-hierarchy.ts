/** A store owned by the signed-in user. Ids are opaque (`store-...`). */
export interface Store {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly lastEdgeSyncAt: Date | null;
}

/** An area of a store (kitchen zone). */
export interface Area {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
}

/** A piece of monitored kitchen equipment inside an area. */
export interface Equipment {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
}

/** An equipment with the area it belongs to, as other screens need to address it. */
export interface EquipmentLocation {
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaId: string;
  readonly areaName: string;
}

/**
 * The permanent link between an equipment and an installed IoT sensor. There is no unbind in this
 * version of the platform.
 */
export interface DeviceBinding {
  readonly id: string;
  readonly equipmentId: string;
  readonly deviceId: string;
  readonly serialNumber: string;
  readonly edgeDeviceId: string;
  readonly linkedAt: Date;
}

/** How the app opens after sign-in, from the number of owned stores. */
export type StoreBootstrap =
  | { readonly kind: 'onboarding' }
  | { readonly kind: 'single'; readonly storeId: string }
  | { readonly kind: 'switcher' };

/**
 * Decides the post-sign-in destination: no stores -> onboarding, one -> select it, several -> switcher.
 * @param stores - The owned stores.
 */
export function bootstrapFor(stores: readonly Store[]): StoreBootstrap {
  if (stores.length === 0) {
    return { kind: 'onboarding' };
  }
  const [only] = stores;
  return stores.length === 1 && only ? { kind: 'single', storeId: only.id } : { kind: 'switcher' };
}

/**
 * Whether a hierarchy name (store, area, equipment) is acceptable: not blank.
 * @param name - The candidate name.
 */
export function isValidHierarchyName(name: string): boolean {
  return name.trim().length > 0;
}
