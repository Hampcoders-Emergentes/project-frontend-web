import { Component, effect, inject, input, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationPreferencesStore } from '@notifications/application/notification-preferences.store';
import {
  deliveryDependsOnConfiguration,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_LIMITS,
  type NotificationChannel,
  type NotificationRoute,
  RECIPIENT_ROLES,
  type RecipientRole,
  requiresDestination,
  routeProblem,
  URGENCY_LEVELS,
} from '@notifications/domain/model/notification-route';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

type RouteGroup = FormGroup<{
  channel: FormControl<NotificationChannel>;
  destination: FormControl<string>;
  recipientRole: FormControl<RecipientRole>;
  recipientName: FormControl<string>;
  critical: FormControl<boolean>;
  nonCritical: FormControl<boolean>;
  enabled: FormControl<boolean>;
}>;

/**
 * Notification channels of a store (US36): up to 20 routes. Email and SMS are only delivered when the
 * deployment configures SMTP / an SMS gateway (otherwise the API logs them), so delivery is never
 * promised for those channels.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, StatePanel, LocalizedDatePipe],
  selector: 'app-notification-preferences-view',
  templateUrl: './notification-preferences.html',
})
export class NotificationPreferencesView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(NotificationPreferencesStore);
  protected readonly channels = NOTIFICATION_CHANNELS;
  protected readonly roles = RECIPIENT_ROLES;
  protected readonly maxRoutes = NOTIFICATION_LIMITS.maxRoutes;
  protected readonly dependsOnConfiguration = deliveryDependsOnConfiguration;
  protected readonly needsDestination = requiresDestination;
  protected readonly submitted = signal(false);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly routes = this.fb.array<RouteGroup>([]);

  constructor() {
    whenChanged(this.storeId, (storeId) => this.store.load(storeId));
    effect(() => {
      const preferences = this.store.preferences.data();
      if (preferences !== null) {
        this.routes.clear();
        preferences.routes.forEach((route) => this.routes.push(this.group(route)));
        this.routes.markAsPristine();
        this.submitted.set(false);
      }
    });
    redirectOnStoreNotFound(this.store.preferences.error);
  }

  protected add(): void {
    if (this.routes.length < this.maxRoutes) {
      this.routes.push(
        this.group({ channel: 'DASHBOARD_PUSH', destination: null, recipientRole: 'STORE_MANAGER', recipientName: null, urgencyLevels: ['CRITICAL'], enabled: true }),
      );
    }
  }

  protected remove(index: number): void {
    this.routes.removeAt(index);
    this.routes.markAsDirty();
  }

  protected problemKey(group: RouteGroup): string | null {
    const problem = routeProblem(this.toRoute(group));
    return problem === null ? null : `notifications.problems.${problem}`;
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.routes.controls.some((group) => this.problemKey(group) !== null)) {
      return;
    }
    this.store.save(this.storeId(), this.routes.controls.map((group) => this.toRoute(group)));
  }

  private toRoute(group: RouteGroup): NotificationRoute {
    const raw = group.getRawValue();
    return {
      channel: raw.channel,
      destination: requiresDestination(raw.channel) && raw.destination.trim() !== '' ? raw.destination.trim() : null,
      recipientRole: raw.recipientRole,
      recipientName: raw.recipientName.trim() === '' ? null : raw.recipientName.trim(),
      urgencyLevels: URGENCY_LEVELS.filter((level) => (level === 'CRITICAL' ? raw.critical : raw.nonCritical)),
      enabled: raw.enabled,
    };
  }

  private group(route: NotificationRoute): RouteGroup {
    return this.fb.group({
      channel: this.fb.control<NotificationChannel>(route.channel),
      destination: this.fb.control(route.destination ?? ''),
      recipientRole: this.fb.control<RecipientRole>(route.recipientRole),
      recipientName: this.fb.control(route.recipientName ?? ''),
      critical: this.fb.control(route.urgencyLevels.includes('CRITICAL')),
      nonCritical: this.fb.control(route.urgencyLevels.includes('NON_CRITICAL')),
      enabled: this.fb.control(route.enabled),
    });
  }
}
