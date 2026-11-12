import { type EnvironmentProviders, inject, Injectable, makeEnvironmentProviders } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import {
  NOTIFICATION_CHANNELS,
  type NotificationPreferences,
  type NotificationRoute,
  RECIPIENT_ROLES,
  URGENCY_LEVELS,
} from '@notifications/domain/model/notification-route';
import { NotificationPreferencesPort } from '@notifications/application/ports/notification-preferences.port';

interface PreferencesResponse {
  isDefault: boolean;
  updatedAtUtc: string | null;
  routes: {
    channel: string;
    destination: string | null;
    recipientRole: string;
    recipientName: string | null;
    urgencyLevels: string[];
    enabled: boolean;
  }[];
}

function toPreferences(r: PreferencesResponse): NotificationPreferences {
  return {
    isDefault: r.isDefault,
    updatedAt: r.updatedAtUtc === null ? null : new Date(r.updatedAtUtc),
    routes: r.routes.flatMap((route) => {
      const channel = NOTIFICATION_CHANNELS.find((c) => c === route.channel);
      if (channel === undefined) {
        return [];
      }
      return [
        {
          channel,
          destination: route.destination,
          recipientRole: RECIPIENT_ROLES.find((role) => role === route.recipientRole) ?? 'STORE_MANAGER',
          recipientName: route.recipientName,
          urgencyLevels: URGENCY_LEVELS.filter((level) => route.urgencyLevels.includes(level)),
          enabled: route.enabled,
        },
      ];
    }),
  };
}

/** Adapter of `GET/PUT /stores/{id}/notification-preferences`; the full `routes` array is always sent. */
@Injectable({ providedIn: 'root' })
export class NotificationPreferencesApi implements NotificationPreferencesPort {
  private readonly api = inject(ApiClient);

  get(storeId: string): Observable<NotificationPreferences> {
    return this.api.get<PreferencesResponse>(apiPath('stores', storeId, 'notification-preferences')).pipe(map(toPreferences));
  }

  update(storeId: string, routes: readonly NotificationRoute[]): Observable<NotificationPreferences> {
    const body = {
      routes: routes.map((route) => {
        const item: Record<string, unknown> = {
          channel: route.channel,
          recipientRole: route.recipientRole,
          urgencyLevels: [...route.urgencyLevels],
          enabled: route.enabled,
        };
        if (route.destination !== null) item['destination'] = route.destination;
        if (route.recipientName !== null) item['recipientName'] = route.recipientName;
        return item;
      }),
    };
    return this.api.put<PreferencesResponse>(apiPath('stores', storeId, 'notification-preferences'), body).pipe(map(toPreferences));
  }
}

/** Binds the notifications ports. */
export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: NotificationPreferencesPort, useExisting: NotificationPreferencesApi }]);
}
