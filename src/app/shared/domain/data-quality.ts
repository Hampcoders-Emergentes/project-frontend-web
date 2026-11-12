/**
 * How much a shown value can be trusted. Ordered by precedence in `dataQualityOf`:
 * - `insufficient`: the API reported too few samples; the value is not a measurement of reality;
 * - `no-data`: nothing to show;
 * - `stale`: the last refresh failed while older data is shown;
 * - `partial`: some parts are missing (for example one period of a comparison);
 * - `fresh`: complete and current.
 */
export type DataQuality = 'fresh' | 'stale' | 'partial' | 'insufficient' | 'no-data';

/** Facts a view knows about the data it shows. */
export interface DataQualityInput {
  readonly hasData: boolean;
  readonly stale?: boolean;
  readonly partial?: boolean;
  readonly insufficient?: boolean;
}

/**
 * Classifies shown data. Insufficient telemetry wins over everything else so it is never rendered as a
 * healthy or zero result.
 * @param input - The facts about the data.
 */
export function dataQualityOf(input: DataQualityInput): DataQuality {
  if (input.insufficient === true) {
    return 'insufficient';
  }
  if (!input.hasData) {
    return 'no-data';
  }
  if (input.stale === true) {
    return 'stale';
  }
  if (input.partial === true) {
    return 'partial';
  }
  return 'fresh';
}

/**
 * Maps the API's `dataQuality` field (`SUFFICIENT` or `INSUFFICIENT_DATA`) to the insufficiency flag.
 * Unknown values are not treated as insufficient, so a new API value never hides data by accident.
 * @param apiValue - The raw value.
 */
export function isInsufficientDataQuality(apiValue: string | null | undefined): boolean {
  return apiValue === 'INSUFFICIENT_DATA';
}
