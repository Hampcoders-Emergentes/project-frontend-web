import { dataQualityOf, isInsufficientDataQuality } from '@shared/domain/data-quality';

describe('dataQualityOf', () => {
  it('reports fresh complete data', () => {
    expect(dataQualityOf({ hasData: true })).toBe('fresh');
  });

  it('never shows insufficient telemetry as healthy, even when it is stale or partial', () => {
    expect(dataQualityOf({ hasData: true, insufficient: true, stale: true, partial: true })).toBe('insufficient');
  });

  it('separates no data from stale data', () => {
    expect(dataQualityOf({ hasData: false, stale: true })).toBe('no-data');
    expect(dataQualityOf({ hasData: true, stale: true })).toBe('stale');
  });

  it('labels partial results', () => {
    expect(dataQualityOf({ hasData: true, partial: true })).toBe('partial');
  });
});

describe('isInsufficientDataQuality', () => {
  it('reads only the documented insufficiency value', () => {
    expect(isInsufficientDataQuality('INSUFFICIENT_DATA')).toBe(true);
    expect(isInsufficientDataQuality('SUFFICIENT')).toBe(false);
    expect(isInsufficientDataQuality('SOMETHING_NEW')).toBe(false);
    expect(isInsufficientDataQuality(undefined)).toBe(false);
  });
});
