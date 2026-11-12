/**
 * IdempotencyKeyPort creates the `Idempotency-Key` of one user action. The caller keeps the key while
 * that same action is retried and asks for a new one when the user changes the submitted data.
 * Declared as an abstract class so it can be used as an Angular DI token.
 */
export abstract class IdempotencyKeyPort {
  /** @returns A new unique key (at most 128 characters). */
  abstract create(): string;
}

/**
 * Keeps one idempotency key per user action: the same key is reused when the identical payload is
 * submitted again (a retry), and a new key is created when the payload changed.
 */
export class IdempotentAction {
  private current: { readonly key: string; readonly fingerprint: string } | null = null;

  constructor(private readonly keys: IdempotencyKeyPort) {}

  /**
   * @param payload - The payload to submit; compared by its JSON serialisation.
   * @returns The key to send with this submission.
   */
  keyFor(payload: unknown): string {
    const fingerprint = JSON.stringify(payload);
    if (this.current === null || this.current.fingerprint !== fingerprint) {
      this.current = { key: this.keys.create(), fingerprint };
    }
    return this.current.key;
  }

  /** Forgets the key once the action has definitively succeeded. */
  complete(): void {
    this.current = null;
  }
}
