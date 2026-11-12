import { Component, type ElementRef, input, output, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Drawing surface for the manager's signature (US40). It has an accessible name and instructions, a
 * keyboard-focusable clear action, and emits the drawing as a base64 PNG (without the data-URL prefix)
 * when it changes, or null when it is empty. The image stays in memory only.
 */
@Component({
  imports: [TranslatePipe],
  selector: 'app-signature-pad',
  styles: `
    :host { display: grid; gap: var(--space-1); }
    canvas { width: 100%; max-width: 36rem; height: 12rem; border: 1px dashed var(--color-border-control); border-radius: var(--radius-control);
      background: var(--color-white); touch-action: none; cursor: crosshair; }
  `,
  template: `
    <p class="ui-field__hint" [id]="instructionsId()">{{ 'compliance.signature.instructions' | translate }}</p>
    <canvas #canvas width="720" height="240" role="img" tabindex="0"
      [attr.aria-label]="'compliance.signature.canvasLabel' | translate"
      [attr.aria-describedby]="instructionsId()"
      (pointerdown)="start($event)" (pointermove)="draw($event)" (pointerup)="end()" (pointercancel)="end()" (pointerleave)="end()"></canvas>
    <div class="ui-actions">
      <button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="empty()" (click)="clear()">
        {{ 'compliance.signature.clear' | translate }}
      </button>
      <span class="text-meta" aria-live="polite">{{ (empty() ? 'compliance.signature.empty' : 'compliance.signature.drawn') | translate }}</span>
    </div>
  `,
})
export class SignaturePad {
  readonly instructionsId = input.required<string>();
  readonly signatureChange = output<string | null>();

  protected readonly empty = signal(true);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private drawing = false;

  protected start(event: PointerEvent): void {
    const context = this.context();
    if (!context) {
      return;
    }
    this.drawing = true;
    this.canvas().nativeElement.setPointerCapture(event.pointerId);
    const { x, y } = this.point(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  protected draw(event: PointerEvent): void {
    const context = this.context();
    if (!this.drawing || !context) {
      return;
    }
    const { x, y } = this.point(event);
    context.lineTo(x, y);
    context.stroke();
    this.empty.set(false);
  }

  protected end(): void {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    this.signatureChange.emit(this.empty() ? null : this.export());
  }

  clear(): void {
    const canvas = this.canvas().nativeElement;
    this.context()?.clearRect(0, 0, canvas.width, canvas.height);
    this.empty.set(true);
    this.signatureChange.emit(null);
  }

  private context(): CanvasRenderingContext2D | null {
    const context = this.canvas().nativeElement.getContext('2d');
    if (context) {
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#172033';
    }
    return context;
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const canvas = this.canvas().nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  private export(): string {
    return this.canvas().nativeElement.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  }
}
