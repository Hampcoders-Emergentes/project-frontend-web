import type { AbstractControl, FormGroup } from '@angular/forms';
import type { AppError } from '@shared/application/app-error';

/**
 * Copies the field errors of a `400` onto the matching form controls as a `server` error, so they are
 * rendered and announced next to their inputs. Keys without a matching control are returned so the
 * view can show them in a form-level message.
 * @param form - The form whose control names match the request property names.
 * @param error - The normalised error.
 * @param aliases - Maps request property names (or dotted paths) to control paths when they differ.
 * @returns The unmatched field names.
 */
export function applyServerFieldErrors(
  form: FormGroup,
  error: AppError | null,
  aliases: Readonly<Record<string, string>> = {},
): string[] {
  const unmatched: string[] = [];
  if (error === null || error.status !== 400 || !error.fields) {
    return unmatched;
  }
  for (const [field, messages] of Object.entries(error.fields)) {
    const control: AbstractControl | null = form.get(aliases[field] ?? field);
    if (control === null) {
      unmatched.push(field);
      continue;
    }
    control.setErrors({ ...(control.errors ?? {}), server: messages.join(' ') });
    control.markAsTouched();
  }
  return unmatched;
}

/**
 * Whether a control should show its validation message.
 * @param control - The control.
 */
export function showControlError(control: AbstractControl): boolean {
  return control.invalid && (control.touched || control.dirty);
}
