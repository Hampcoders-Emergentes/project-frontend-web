import { Component, computed, input } from '@angular/core';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/** One bar: a translated/formatted label and a value; `null` is a gap (missing data), never zero. */
export interface BarDatum {
  readonly label: string;
  readonly value: number | null;
}

/**
 * Minimal accessible bar chart (SVG). It has an accessible name, states its unit, draws missing values
 * as gaps (no interpolation), and always renders an equivalent data table for assistive technologies
 * and for exact values. Colors carry no meaning on their own.
 */
@Component({
  imports: [LocalizedNumberPipe],
  selector: 'app-bar-chart',
  styles: `
    :host { display: grid; gap: var(--space-1); }
    svg { width: 100%; height: 12rem; display: block; }
    .bar { fill: var(--color-cyan); }
    .gap { fill: none; stroke: var(--color-offline); stroke-dasharray: 3 3; }
    .axis { stroke: var(--border-subtle); }
    details summary { cursor: pointer; color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  `,
  template: `
    <figure style="margin: 0">
      <figcaption class="text-meta">{{ caption() }} ({{ unit() }})</figcaption>
      <svg role="img" [attr.aria-label]="caption() + ' (' + unit() + ')'" [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none">
        <line class="axis" x1="0" [attr.y1]="height - 1" [attr.x2]="width" [attr.y2]="height - 1" />
        @for (bar of bars(); track $index) {
          @if (bar.value === null) {
            <rect class="gap" [attr.x]="bar.x" [attr.y]="height - 8" [attr.width]="bar.width" height="7" />
          } @else {
            <rect class="bar" [attr.x]="bar.x" [attr.y]="height - bar.height" [attr.width]="bar.width" [attr.height]="bar.height">
              <title>{{ bar.label }}: {{ bar.value | localizedNumber: fractionDigits() }} {{ unit() }}</title>
            </rect>
          }
        }
      </svg>
    </figure>
    <details>
      <summary>{{ tableLabel() }}</summary>
      <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="caption()">
        <table class="ui-table">
          <thead><tr><th scope="col">{{ labelHeader() }}</th><th scope="col" class="num">{{ unit() }}</th></tr></thead>
          <tbody>
            @for (datum of data(); track $index) {
              <tr><th scope="row">{{ datum.label }}</th><td class="num">{{ datum.value === null ? gapLabel() : (datum.value | localizedNumber: fractionDigits()) }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </details>
  `,
})
export class BarChart {
  readonly data = input.required<readonly BarDatum[]>();
  /** Translated accessible name of the chart. */
  readonly caption = input.required<string>();
  readonly unit = input.required<string>();
  /** Translated header of the label column and the toggle of the data table. */
  readonly labelHeader = input.required<string>();
  readonly tableLabel = input.required<string>();
  /** Translated text shown for missing values. */
  readonly gapLabel = input.required<string>();
  readonly fractionDigits = input(1);

  protected readonly width = 600;
  protected readonly height = 180;

  protected readonly bars = computed(() => {
    const data = this.data();
    const max = Math.max(0, ...data.map((datum) => datum.value ?? 0));
    const slot = data.length === 0 ? 0 : this.width / data.length;
    return data.map((datum, index) => ({
      label: datum.label,
      value: datum.value,
      x: index * slot + slot * 0.1,
      width: Math.max(1, slot * 0.8),
      height: datum.value === null || max === 0 ? 0 : Math.max(1, (datum.value / max) * (this.height - 4)),
    }));
  });
}
