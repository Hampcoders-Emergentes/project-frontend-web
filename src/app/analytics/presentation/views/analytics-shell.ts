import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

const TABS = ['consumption', 'comparison', 'off-hours', 'costs', 'maintenance', 'reports', 'opening-hours'] as const;

/** Energy analytics section: title and sub-navigation; each tab is a lazy child route. */
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  selector: 'app-analytics-shell-view',
  template: `
    <div class="ui-stack">
      <header class="ui-page-header">
        <div>
          <h1 class="ui-page-header__title">{{ 'analytics.title' | translate }}</h1>
          <p class="ui-page-header__subtitle">{{ 'analytics.subtitle' | translate }}</p>
        </div>
      </header>
      <nav [attr.aria-label]="'analytics.sections' | translate">
        <ul class="ui-tabs">
          @for (tab of tabs; track tab) {
            <li><a [routerLink]="tab" routerLinkActive ariaCurrentWhenActive="page">{{ 'analytics.tabs.' + tab | translate }}</a></li>
          }
        </ul>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AnalyticsShellView {
  protected readonly tabs = TABS;
}
