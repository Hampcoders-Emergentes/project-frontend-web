import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/**
 * Formats an amount in the currency returned by the API (ISO 4217 code, for example `PEN`) in the
 * active language. Unknown codes fall back to "amount CODE".
 *
 * @example {{ cost | localizedCurrency: projection.currency }}
 */
@Pipe({ name: 'localizedCurrency', pure: false })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly formats = new Map<string, Intl.NumberFormat>();

  transform(value: number | null | undefined, currency: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    const language = activeLanguage(this.translate);
    const key = `${language}|${currency}`;
    try {
      let format = this.formats.get(key);
      if (!format) {
        format = new Intl.NumberFormat(language, { style: 'currency', currency: currency.toUpperCase() });
        this.formats.set(key, format);
      }
      return format.format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
}
