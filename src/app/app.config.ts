import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { provideIam } from '@iam/infrastructure/iam.providers';
import { provideStores } from '@stores/infrastructure/stores.providers';
import { provideMonitoring } from '@monitoring/infrastructure/monitoring.providers';
import { provideAlerts } from '@alerts/infrastructure/alerts.providers';
import { provideAnalytics } from '@analytics/infrastructure/analytics.providers';
import { provideCompliance } from '@compliance/infrastructure/compliance.providers';
import { provideNotifications } from '@notifications/infrastructure/notifications.providers';
import { provideAudit } from '@audit/infrastructure/audit.providers';
import { authenticationInterceptor } from '@shared/infrastructure/http/authentication.interceptor';
import { resilienceInterceptor } from '@shared/infrastructure/http/resilience.interceptor';
import { provideSharedInfrastructure } from '@shared/infrastructure/shared.providers';
import { provideIconSprite } from '@shared/presentation/components/icon/icon-sprite';

const SUPPORTED_LANGUAGES = ['en', 'es'];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Outer to inner: the auth interceptor adds the bearer and refreshes once on 401; the resilience
    // interceptor retries GETs on network/5xx/429 with back-off.
    provideHttpClient(withInterceptors([authenticationInterceptor, resilienceInterceptor])),
    provideSharedInfrastructure(),
    provideIam(),
    provideStores(),
    provideMonitoring(),
    provideAlerts(),
    provideAnalytics(),
    provideCompliance(),
    provideNotifications(),
    provideAudit(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.addLangs(SUPPORTED_LANGUAGES);
      const browserLang = translate.getBrowserLang();
      const selected = browserLang && SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : 'en';
      return firstValueFrom(translate.use(selected));
    }),
    provideIconSprite(),
    // Child views receive `storeId` (and other ancestor params) as component inputs.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
  ],
};
