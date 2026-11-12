import { Component, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ComplianceStore } from '@compliance/application/compliance.store';
import { SIGNATURE_MAX_BASE64_LENGTH } from '@compliance/domain/model/compliance';
import { SignaturePad } from '@compliance/presentation/components/signature-pad/signature-pad';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Manager digital signature (US40), embedded by the API in OHS reports. */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, SignaturePad, ErrorNotice, StatePanel, LocalizedDatePipe],
  selector: 'app-signature-view',
  template: `
    <section class="ui-stack" aria-labelledby="sig-current-title">
      <h2 id="sig-current-title">{{ 'compliance.signature.current' | translate }}</h2>
      @if (store.signature.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.signature.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.signature.data(); as sig) {
        <div class="ui-card ui-stack" style="gap: var(--space-1)">
          <dl class="ui-dl">
            <dt>{{ 'compliance.signature.signerName' | translate }}</dt><dd>{{ sig.signerName }}</dd>
            <dt>{{ 'compliance.signature.signerTitle' | translate }}</dt><dd>{{ sig.signerTitle }}</dd>
            <dt>{{ 'compliance.signature.signedAt' | translate }}</dt><dd>{{ sig.signedAt | localizedDate: 'dateTime' }}</dd>
          </dl>
          @if (previewUrl(); as url) {
            <img [src]="url" [alt]="'compliance.signature.previewAlt' | translate: { name: sig.signerName }" style="max-width: 18rem; border: 1px solid var(--border-subtle)" />
          } @else {
            <div><button class="ui-button ui-button--secondary ui-button--small" type="button" (click)="preview()">{{ 'compliance.signature.showPreview' | translate }}</button></div>
          }
        </div>
      } @else {
        <p class="ui-notice">{{ 'compliance.signature.none' | translate }}</p>
      }
    </section>

    <section class="ui-card ui-stack" aria-labelledby="sig-new-title">
      <h2 id="sig-new-title">{{ 'compliance.signature.register' | translate }}</h2>
      @if (store.signatureState.error(); as failure) { <app-error-notice [error]="failure" /> }
      @if (store.signatureState.succeededAt()) { <p class="ui-notice ui-notice--success" role="status">{{ 'compliance.signature.saved' | translate }}</p> }
      <form class="ui-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="ui-form-grid">
          <div class="ui-field"><label class="ui-field__label" for="sig-name">{{ 'compliance.signature.signerName' | translate }}</label>
            <input class="ui-input" id="sig-name" formControlName="signerName" autocomplete="name" [attr.aria-invalid]="(form.controls.signerName.invalid && form.controls.signerName.touched) || null" />
            @if (form.controls.signerName.invalid && form.controls.signerName.touched) { <p class="ui-field__error">{{ 'shared.validation.required' | translate }}</p> }</div>
          <div class="ui-field"><label class="ui-field__label" for="sig-title">{{ 'compliance.signature.signerTitle' | translate }}</label>
            <input class="ui-input" id="sig-title" formControlName="signerTitle" autocomplete="organization-title" [attr.aria-invalid]="(form.controls.signerTitle.invalid && form.controls.signerTitle.touched) || null" />
            @if (form.controls.signerTitle.invalid && form.controls.signerTitle.touched) { <p class="ui-field__error">{{ 'shared.validation.required' | translate }}</p> }</div>
        </div>
        <app-signature-pad instructionsId="sig-instructions" (signatureChange)="image.set($event)" />
        @if (imageProblem(); as key) { <p class="ui-field__error" role="alert">{{ key | translate }}</p> }
        <div><button class="ui-button" type="submit" [disabled]="store.signatureState.submitting()">{{ (store.signatureState.submitting() ? 'shared.actions.saving' : 'compliance.signature.register') | translate }}</button></div>
      </form>
    </section>
  `,
  styles: ':host { display: grid; gap: var(--space-3); }',
})
export class SignatureView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(ComplianceStore);
  protected readonly image = signal<string | null>(null);
  protected readonly imageProblem = signal<string | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  private readonly pad = viewChild(SignaturePad);
  protected readonly form = inject(NonNullableFormBuilder).group({
    signerName: ['', [Validators.required, Validators.pattern(/\S/)]],
    signerTitle: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    whenChanged(this.storeId, () => this.load());
    inject(DestroyRef).onDestroy(() => this.releasePreview());
  }

  protected load(): void {
    this.releasePreview();
    this.store.signatureState.clear();
    this.store.loadSignature(this.storeId());
  }

  protected preview(): void {
    this.store.previewSignature(this.storeId(), (url) => this.previewUrl.set(url));
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const image = this.image();
    const problem = image === null ? 'compliance.signature.required' : image.length > SIGNATURE_MAX_BASE64_LENGTH ? 'compliance.signature.tooLarge' : null;
    this.imageProblem.set(problem);
    if (this.form.invalid || problem !== null || image === null) {
      return;
    }
    const { signerName, signerTitle } = this.form.getRawValue();
    this.store.registerSignature(this.storeId(), signerName, signerTitle, image, () => {
      this.releasePreview();
      this.image.set(null);
      this.pad()?.clear();
    });
  }

  private releasePreview(): void {
    const url = this.previewUrl();
    if (url !== null) {
      this.store.releasePreview(url);
      this.previewUrl.set(null);
    }
  }
}
