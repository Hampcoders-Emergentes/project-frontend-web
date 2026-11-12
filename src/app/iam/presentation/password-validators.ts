import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@iam/domain/model/authenticated-user';

/** Length rules of a new password. */
export const NEW_PASSWORD_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(PASSWORD_MIN_LENGTH),
  Validators.maxLength(PASSWORD_MAX_LENGTH),
];

/**
 * Group validator: the confirmation control must equal the password control.
 * @param password - Name of the password control.
 * @param confirmation - Name of the confirmation control.
 */
export function passwordsMatch(password: string, confirmation: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null =>
    group.get(password)?.value === group.get(confirmation)?.value ? null : { passwordMismatch: true };
}

/** Translation key of the first error of a new-password control. */
export function newPasswordErrorKey(control: AbstractControl): string {
  if (control.hasError('required')) {
    return 'iam.validation.required';
  }
  if (control.hasError('minlength') || control.hasError('maxlength')) {
    return 'iam.validation.passwordLength';
  }
  return 'iam.validation.passwordRejected';
}
