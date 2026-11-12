import { Component, computed, input } from '@angular/core';

/** The shape of the content a skeleton stands in for. */
export type SkeletonVariant = 'cards' | 'rows';

/**
 * Shimmering placeholder for the first load of a card grid or a table, so the layout does not jump when
 * the data arrives. It is announced once as a busy status with the translated label; the placeholder
 * blocks are hidden from assistive technologies. The shimmer stops under `prefers-reduced-motion`.
 */
@Component({
  selector: 'app-skeleton',
  styles: `
    :host { display: block; }
    .skeleton--cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); gap: var(--space-2); }
    .skeleton--rows { display: grid; gap: 0; overflow: hidden; border: 1px solid var(--border-subtle);
      border-radius: var(--radius-card); background: var(--surface-card); }
    .skeleton__card { display: grid; gap: 0.75rem; padding: var(--space-3); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-card); background: var(--surface-card); }
    .skeleton__row { display: flex; gap: var(--space-2); padding: 0.875rem var(--space-2); border-block-end: 1px solid var(--border-subtle); }
    .skeleton__row:last-child { border-block-end: 0; }
    .skeleton__line { height: 0.875rem; }
    .skeleton__line--short { width: 40%; }
    .skeleton__line--title { width: 70%; height: 1.25rem; }
    .skeleton__line--metric { width: 55%; height: 2rem; }
    .skeleton__cell { flex: 1; height: 0.875rem; }
  `,
  template: `
    <div role="status" aria-busy="true">
      <span class="sr-only">{{ label() }}</span>
      @if (variant() === 'cards') {
        <div class="skeleton--cards" aria-hidden="true">
          @for (item of items(); track item) {
            <div class="skeleton__card">
              <span class="ui-skeleton skeleton__line skeleton__line--short"></span>
              <span class="ui-skeleton skeleton__line skeleton__line--title"></span>
              <span class="ui-skeleton skeleton__line skeleton__line--metric"></span>
              <span class="ui-skeleton skeleton__line"></span>
            </div>
          }
        </div>
      } @else {
        <div class="skeleton--rows" aria-hidden="true">
          @for (item of items(); track item) {
            <div class="skeleton__row">
              <span class="ui-skeleton skeleton__cell"></span>
              <span class="ui-skeleton skeleton__cell"></span>
              <span class="ui-skeleton skeleton__cell"></span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('cards');
  readonly count = input(3);
  /** The translated loading message announced to assistive technologies. */
  readonly label = input.required<string>();

  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, index) => index));
}
