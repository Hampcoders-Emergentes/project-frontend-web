/** A downloaded binary file (report, export, signature image). */
export interface DownloadedFile {
  readonly blob: Blob;
  readonly fileName: string;
  readonly contentType: string;
}

/**
 * FileSaverPort hands a downloaded file to the browser, either as a save or as an object URL for preview.
 * Declared as an abstract class so it can be used as an Angular DI token.
 */
export abstract class FileSaverPort {
  /** Starts a browser download of the file. */
  abstract save(file: DownloadedFile): void;

  /** Creates an object URL for an in-page preview; release it with `revoke`. */
  abstract preview(file: DownloadedFile): string;

  /** Releases an object URL created by `preview`. */
  abstract revoke(url: string): void;
}
