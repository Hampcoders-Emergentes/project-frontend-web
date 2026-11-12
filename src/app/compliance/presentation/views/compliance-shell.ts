import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ComplianceStore } from '@compliance/application/compliance.store';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

const TABS = ['checklist', 'certificates', 'score', 'signature', 'reports'] as const;

/** OHS compliance section with sub-navigation; shows realtime compliance notices when they arrive. */
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe, Icon, LocalizedDatePipe],
  selector: 'app-compliance-shell-view',
  template: `
    <div class="ui-stack">
      <header class="ui-page-header">
        <div>
          <h1 class="ui-page-header__title">{{ 'compliance.title' | translate }}</h1>
          <p class="ui-page-header__subtitle">{{ 'compliance.subtitle' | translate }}</p>
        </div>
      </header>
      @if (store.lastNotice(); as at) {
        <div class="ui-notice ui-notice--warning" role="status">
          <app-icon class="ui-notice__icon" name="bell-ringing" />
          <p class="ui-notice__body">{{ 'compliance.noticeReceived' | translate: { time: (at | localizedDate: 'time') } }}</p>
        </div>
      }
      <nav [attr.aria-label]="'compliance.sections' | translate">
        <ul class="ui-tabs">
          @for (tab of tabs; track tab) {
            <li><a [routerLink]="tab" routerLinkActive ariaCurrentWhenActive="page">{{ 'compliance.tabs.' + tab | translate }}</a></li>
          }
        </ul>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class ComplianceShellView {
  protected readonly store = inject(ComplianceStore);
  protected readonly tabs = TABS;
}
