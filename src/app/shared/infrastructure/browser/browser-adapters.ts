import { DOCUMENT, inject, Injectable } from '@angular/core';
import { distinctUntilChanged, fromEvent, map, type Observable, shareReplay, startWith } from 'rxjs';
import type { DownloadedFile, FileSaverPort } from '@shared/application/file-saver.port';
import type { IdempotencyKeyPort } from '@shared/application/idempotency-key.port';
import type { PageVisibilityPort } from '@shared/application/polling';

/** Page visibility from the Page Visibility API. */
@Injectable({ providedIn: 'root' })
export class DocumentPageVisibility implements PageVisibilityPort {
  private readonly document = inject(DOCUMENT);

  readonly visible$: Observable<boolean> = fromEvent(this.document, 'visibilitychange').pipe(
    startWith(null),
    map(() => this.document.visibilityState !== 'hidden'),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

/** Idempotency keys from the Web Crypto API (UUID v4, 36 characters). */
@Injectable({ providedIn: 'root' })
export class CryptoIdempotencyKey implements IdempotencyKeyPort {
  create(): string {
    return crypto.randomUUID();
  }
}

/** Saves and previews downloaded files with object URLs. */
@Injectable({ providedIn: 'root' })
export class BrowserFileSaver implements FileSaverPort {
  private readonly document = inject(DOCUMENT);

  save(file: DownloadedFile): void {
    const url = URL.createObjectURL(file.blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = file.fileName;
    anchor.rel = 'noopener';
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  preview(file: DownloadedFile): string {
    return URL.createObjectURL(file.blob);
  }

  revoke(url: string): void {
    URL.revokeObjectURL(url);
  }
}
